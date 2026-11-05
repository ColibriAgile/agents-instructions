import { cp, lstat, mkdir, mkdtemp, readFile, readlink, realpath, rm, symlink } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { agents, canonicalPath, targetPath } from './agents.js';
import type { Agent, Method, Scope } from './agents.js';
import { backend, jsonArray } from './backend.js';
import { isMissing, readSkillMeta, skillName } from './catalog.js';
import type { Catalog, Selection } from './catalog.js';
import { Interrupted, directoryHash, exists, loadState, onForceExit, saveState, withScopeLock } from './storage.js';
import type { State } from './storage.js';
import { readManifest } from './manifest.js';
import { requirementInfo, unknownNotice } from './requirements.js';
import type { RequirementInfo } from './requirements.js';

export interface PlanItem extends Selection {
  targets: { agent: Agent; method: Method }[]; runtime: RequirementInfo;
  /** remove only: the owned canonical copy this item deletes because no managed target remains. */
  removesCanonical?: string;
}
export interface Plan { action: 'install' | 'update' | 'remove'; scope: Scope; items: PlanItem[]; manifest?: { path: string; revision: string | null } }
export interface Summary { added: number; updated: number; unchanged: number; removed: number }

export function installPlan(scope: Scope, selection: Selection[], targetAgents: Agent[], method: Method): Plan {
  if (!selection.length) throw new Error('Nenhuma skill selecionada');
  if (!targetAgents.length) throw new Error('Selecione ao menos um agente');
  return { action: 'install', scope, items: selection.map(s => ({ ...s, runtime: requirementInfo(s.requirements), targets: targetAgents.map(agent => ({ agent, method })) })) };
}

export async function managedPlan(action: 'update' | 'remove', scope: Scope, catalog: Catalog, names?: string[], targetAgents?: Agent[]): Promise<Plan> {
  const state = await loadState(scope);
  const selected = names?.length ? [...new Set(names)] : Object.keys(state.skills).filter(name => Object.keys(state.skills[name]!.targets).length);
  const items = selected.map(name => {
    skillName(name);
    const skill = state.skills[name];
    if (!skill) throw new Error(`A skill ${name} não é gerenciada pela Colibri neste escopo`);
    const targets = Object.entries(skill.targets)
      .filter(([agent]) => !targetAgents || targetAgents.includes(agent as Agent))
      .map(([agent, value]) => ({ agent: agent as Agent, method: value!.method }));
    const requirements = skill.origin === 'catalog' ? catalog.skills.find(s => s.name === name)?.requirements ?? null : null;
    // Same rule removeItem applies: the canonical copy goes only with the last target and only when the CLI owns it.
    const removesAll = Object.keys(skill.targets).every(agent => targets.some(t => t.agent === agent));
    const removesCanonical = action === 'remove' && removesAll && skill.canonicalHash ? canonicalPath(scope, name) : undefined;
    return { name, source: skill.origin === 'catalog' ? catalog.source : skill.source, origin: skill.origin, requirements, runtime: requirementInfo(requirements), targets, ...(removesCanonical ? { removesCanonical } : {}) };
  }).filter(s => s.targets.length);
  if (!items.length) throw new Error('Nenhuma skill gerenciada corresponde ao escopo e aos agentes selecionados');
  return { action, scope, items };
}

function effectiveSource(source: string, scope: Scope): string {
  if (source.startsWith('.')) return resolve(scope.cwd, source);
  return source;
}

async function safeTarget(path: string, source: string, scope: Scope): Promise<void> {
  // A symlinked agent parent must not redirect installation outside the displayed destination.
  let parent = dirname(path);
  while (!await exists(parent)) parent = dirname(parent);
  const base = scope.global ? homedir() : scope.cwd;
  const fromBase = relative(base, parent);
  // Resolve aliases above the chosen root (e.g. macOS /var → /private/var).
  // Inside the selected root, redirected agent directories still require manual resolution.
  if (!fromBase.startsWith('..') && !isAbsolute(fromBase)) {
    const expected = resolve(await realpath(base), fromBase);
    if (resolve(await realpath(parent)) !== expected) throw new Error(`O diretório pai é um symlink e exige resolução manual: ${parent}`);
  }
  if (isAbsolute(source)) {
    const realSource = await realpath(source).catch(error => {
      if (isMissing(error)) return resolve(source);
      throw error;
    });
    const realDestination = await realpath(path).catch(async error => {
      if (isMissing(error)) return resolve(await realpath(parent), relative(parent, path));
      throw error;
    });
    const delta = relative(realSource, realDestination);
    const reverse = relative(realDestination, realSource);
    const inside = (p: string) => !p || (!p.startsWith(`..${sep}`) && p !== '..' && !isAbsolute(p));
    if (inside(delta) || inside(reverse)) throw new Error(`O destino se sobrepõe à origem: ${path}`);
  }
}

async function guard(plan: Plan, state: State, force: boolean): Promise<void> {
  for (const item of plan.items) {
    const managed = state.skills[item.name];
    const selectedAgents = item.targets.map(t => t.agent);
    const canonical = canonicalPath(plan.scope, item.name);
    const paths = new Set(item.targets.map(t => targetPath(plan.scope, t.agent, item.name)));
    if (plan.action !== 'remove' && item.targets.some(t => t.method === 'symlink')) paths.add(canonical);
    // Removing every target also removes the canonical copy the CLI owns, so a modified copy must block it.
    if (plan.action === 'remove' && managed?.canonicalHash && Object.keys(managed.targets).every(a => selectedAgents.includes(a as Agent))) paths.add(canonical);
    for (const path of paths) {
      await safeTarget(path, effectiveSource(item.source, plan.scope), plan.scope);
      const owners = Object.entries(managed?.targets ?? {}).filter(([a, t]) =>
        targetPath(plan.scope, a as Agent, item.name) === path || (path === canonical && t!.method === 'symlink'));
      const ownedCanonical = path === canonical ? managed?.canonicalHash : undefined;
      if (await exists(path) && !force) {
        if (!owners.length && !ownedCanonical) throw new Error(`Destino não gerenciado: ${path}. Use --force para substituí-lo explicitamente.`);
        const expected = ownedCanonical ?? owners[0]?.[1]?.hash;
        if (await directoryHash(path) !== expected) throw new Error(`A skill instalada foi modificada: ${path}. Use --force para sobrescrever ou remover.`);
      }
      // Shared directories and canonical symlinks cannot be changed for one consumer only.
      for (const [agent, target] of Object.entries(managed?.targets ?? {})) {
        if (selectedAgents.includes(agent as Agent)) continue;
        const other = targetPath(plan.scope, agent as Agent, item.name);
        if (other === path || (path === canonical && target!.method === 'symlink')) {
          // Identical reinstallation may add another alias without changing existing content.
          if (plan.action === 'install' && isAbsolute(item.source) && await directoryHash(resolve(item.source, item.name)) === await directoryHash(path)) continue;
          throw new Error(`O destino compartilhado ${path} também é usado por ${agents[agent as Agent].label}. Selecione todos os agentes que o compartilham.`);
        }
      }
    }
    if (managed && (managed.origin !== item.origin || (item.origin === 'external' && managed.source !== effectiveSource(item.source, plan.scope)))) {
      if (Object.keys(managed.targets).some(agent => !selectedAgents.includes(agent as Agent))) {
        throw new Error(`Trocar a origem de ${item.name} exige selecionar todos os agentes gerenciados, mesmo com --force`);
      }
      if (!force) throw new Error(`A skill ${item.name} é gerenciada a partir de outra origem; use --force para substituí-la`);
    }
  }
}

const label: Record<Plan['action'], string> = { install: 'INSTALAR', update: 'ATUALIZAR', remove: 'REMOVER' };

export function preview(plan: Plan): string {
  const lines = [`${label[plan.action]} · ${plan.scope.global ? 'global' : 'projeto'} · ${plan.scope.cwd}`];
  for (const item of plan.items) {
    lines.push(`${item.name} ← ${item.source}`);
    lines.push(`  ${item.runtime.summary}`);
    if (plan.action !== 'remove') {
      if (item.runtime.platformStatus !== 'unknown') lines.push(`  ${item.runtime.notice}`);
      for (const note of item.runtime.notes) lines.push(`  · ${note}`);
    }
    for (const target of item.targets) lines.push(`  ${agents[target.agent].label} · ${target.method} → ${targetPath(plan.scope, target.agent, item.name)}`);
    if (item.removesCanonical) lines.push(`  ⚠ Apaga a cópia canônica ${item.removesCanonical}; links criados fora da Colibri que apontam para ela deixam de funcionar.`);
  }
  if (plan.action !== 'remove' && plan.items.some(i => i.runtime.platformStatus === 'unknown')) lines.push(unknownNotice);
  lines.push('Agentes que usam .agents/skills compartilham o mesmo diretório. O modo symlink pode recorrer a copy.');
  return lines.join('\n');
}

// Restore only paths this backend group may change; earlier successful groups stay managed.
async function withInstallRollback<T>(paths: string[], action: () => Promise<T>): Promise<T> {
  const directory = await mkdtemp(join(tmpdir(), 'colibri-rollback-'));
  const snapshots: { path: string; backup?: string; link?: string }[] = [];
  let keepBackup = false;
  const forgetForceExit = onForceExit(() => `Cópias de recuperação: ${directory}.`);
  try {
    for (const path of new Set(paths)) {
      if (!await exists(path)) { snapshots.push({ path }); continue; }
      // fs.cp recreates links without a type, and Windows then needs admin; keep only the target to restore it as the backend does.
      if ((await lstat(path)).isSymbolicLink()) { snapshots.push({ path, link: await readlink(path) }); continue; }
      const backup = join(directory, String(snapshots.length));
      await cp(path, backup, { recursive: true, verbatimSymlinks: true });
      snapshots.push({ path, backup });
    }
    try { return await action(); }
    catch (error) {
      const failures: unknown[] = [];
      for (const { path, backup, link } of snapshots) {
        try {
          if (await exists(path)) await rm(path, { recursive: true, force: true });
          if (link !== undefined) await symlink(link, path, process.platform === 'win32' ? 'junction' : 'dir');
          else if (backup) await cp(backup, path, { recursive: true, verbatimSymlinks: true });
        } catch (failure) { failures.push(failure); }
      }
      if (failures.length) {
        keepBackup = true;
        throw new AggregateError([error, ...failures], `A instalação falhou e a reversão ficou incompleta. Cópias de recuperação: ${directory}. Erro original: ${String(error)}`);
      }
      if (error instanceof Interrupted) throw new Interrupted(error.signal, 'As alterações em andamento foram revertidas; rode o comando de novo para concluir.');
      throw error;
    }
  } finally { forgetForceExit(); if (!keepBackup) await rm(directory, { recursive: true, force: true }); }
}

export async function executePlan(plan: Plan, force = false, onSuccess?: () => Promise<void>): Promise<Summary> {
  return withScopeLock(plan.scope, async interruption => {
    if (plan.manifest && (await readManifest(plan.manifest.path)).revision !== plan.manifest.revision) {
      throw new Error(`O manifesto mudou desde a prévia: ${plan.manifest.path}. Prepare uma nova prévia antes de aplicar as alterações.`);
    }
    const state = await loadState(plan.scope);
    await guard(plan, state, force);
    const summary: Summary = { added: 0, updated: 0, unchanged: 0, removed: 0 };
    for (const item of plan.items) {
      interruption.throwIfAborted();
      if (plan.action === 'remove') {
        await removeItem(plan.scope, item, state, interruption);
        summary.removed++;
        await saveState(plan.scope, state);
        continue;
      }
      const before = await Promise.all(item.targets.map(t => directoryHash(targetPath(plan.scope, t.agent, item.name))));
      const source = effectiveSource(item.source, plan.scope);
      for (const method of [...new Set(item.targets.map(t => t.method))]) {
        const targets = item.targets.filter(t => t.method === method);
        const affectedPaths = targets.map(t => targetPath(plan.scope, t.agent, item.name));
        if (method === 'symlink') affectedPaths.push(canonicalPath(plan.scope, item.name));
        await withInstallRollback(affectedPaths, async () => {
          interruption.throwIfAborted();
          for (const t of targets) await mkdir(dirname(targetPath(plan.scope, t.agent, item.name)), { recursive: true });
          const result = jsonArray(await backend([
            'add', source, '--skill', item.name, '--agent', ...targets.map(t => t.agent), '--yes', '--json',
            ...(method === 'copy' ? ['--copy'] : []), ...(plan.scope.global ? ['--global'] : []),
          ], plan.scope, interruption));
          if (!result.some(r => r.name === item.name && r.status === 'installed')) throw new Error(`O backend não instalou ${item.name}`);
          const managed = state.skills[item.name] ?? { source, origin: item.origin, targets: {} };
          managed.source = source;
          managed.origin = item.origin;
          for (const t of targets) {
            const path = targetPath(plan.scope, t.agent, item.name);
            const skillFile = join(path, 'SKILL.md');
            const text = await readFile(skillFile, 'utf8');
            let name: string | undefined;
            try { name = readSkillMeta(text, skillFile).name; } catch { /* reported below with the file path */ }
            if (name !== item.name) throw new Error(`SKILL.md instalado inválido: ${skillFile}`);
            const hash = await directoryHash(path);
            if (!hash) throw new Error(`O backend não criou o destino solicitado: ${path}`);
            const actualMethod = (await lstat(path)).isSymbolicLink() ||
              (path === canonicalPath(plan.scope, item.name) && result.some(r => r.name === item.name && r.mode === 'symlink')) ? 'symlink' : 'copy';
            managed.targets[t.agent] = { method: actualMethod, hash };
          }
          if (targets.some(t => t.method === 'symlink' || targetPath(plan.scope, t.agent, item.name) === canonicalPath(plan.scope, item.name))) {
            managed.canonicalHash = await directoryHash(canonicalPath(plan.scope, item.name)) ?? undefined;
          }
          state.skills[item.name] = managed;
          // Successful groups remain recoverable even if a later source fails.
          await saveState(plan.scope, state);
        });
      }
      const after = await Promise.all(item.targets.map(t => directoryHash(targetPath(plan.scope, t.agent, item.name))));
      if (before.some(h => h === null)) summary.added++;
      else if (before.some((h, i) => h !== after[i])) summary.updated++;
      else summary.unchanged++;
    }
    const first = plan.items[0]?.targets[0];
    if (first && plan.action === 'install') {
      state.preferences = { agents: [...new Set(plan.items.flatMap(i => i.targets.map(t => t.agent)))], method: first.method };
      await saveState(plan.scope, state);
    }
    await onSuccess?.();
    return summary;
  });
}

async function removeItem(scope: Scope, item: PlanItem, state: State, interruption: AbortSignal): Promise<void> {
  const managed = state.skills[item.name];
  if (!managed) throw new Error(`A skill ${item.name} não é mais gerenciada`);
  const remaining = Object.keys(managed.targets).filter(a => !item.targets.some(t => t.agent === a));
  const canonical = canonicalPath(scope, item.name);
  // Partial removal is directory-local. The backend lock must remain while another target uses it.
  for (const path of new Set(item.targets.map(t => targetPath(scope, t.agent, item.name)))) await rm(path, { recursive: true, force: true });
  // The canonical copy is deleted only when no target remains and the CLI recorded owning it.
  if (!remaining.length && managed.canonicalHash) await rm(canonical, { recursive: true, force: true });
  if (!remaining.length && !await exists(canonical)) {
    // Let the backend maintain its own locks. Never let its cleanup touch an unrelated canonical skill.
    await backend(['remove', item.name, '--agent', ...item.targets.map(t => t.agent), '--yes', ...(scope.global ? ['--global'] : [])], scope, interruption);
  }
  for (const target of item.targets) delete managed.targets[target.agent];
  if (!await exists(canonical)) delete managed.canonicalHash;
  if (!Object.keys(managed.targets).length && !managed.canonicalHash) delete state.skills[item.name];
}
