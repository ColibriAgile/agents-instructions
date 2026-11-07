import * as p from '@clack/prompts';
import { resolve } from 'node:path';
import { validateAgents } from './agents.js';
import type { Agent, Method, Scope } from './agents.js';
import { loadCatalog, resolveSelection } from './catalog.js';
import type { Catalog } from './catalog.js';
import { installPlan, managedPlan, executePlan, preview } from './manager.js';
import type { Plan } from './manager.js';
import { readManifest, saveManifest } from './manifest.js';
import { directoryHash, exists, loadState } from './storage.js';
import { targetPath } from './agents.js';
import { requirementInfo, summarizeDescription, unknownNotice } from './requirements.js';

export interface Options {
  cwd?: string; catalog?: string; global?: boolean; agent?: string[]; skill?: string[]; bundle?: string[];
  method?: Method; manifest?: string; yes?: boolean; force?: boolean; dryRun?: boolean; json?: boolean; available?: boolean;
  /** Internal (wizard only): the selected bundles replace the manifest bundles instead of adding to them. */
  replaceBundles?: boolean;
}

export const values = (items?: string[]): string[] => [...new Set((items ?? []).flatMap(i => i.split(',')).map(i => i.trim()).filter(Boolean))];
export const scopeFor = (options: Options): Scope => ({ cwd: resolve(options.cwd ?? '.'), global: options.global ?? false });

export async function prepareInstall(catalog: Catalog, options: Options): Promise<{ plan: Plan; save?: () => Promise<void>; droppedBundles: string[] }> {
  const scope = scopeFor(options);
  const state = await loadState(scope);
  const targets = validateAgents(values(options.agent?.length ? options.agent : state.preferences?.agents));
  const bundles = values(options.bundle);
  const names = values(options.skill);
  const method = options.method ?? state.preferences?.method ?? 'copy';
  if (!['copy', 'symlink'].includes(method)) throw new Error('O método deve ser copy ou symlink');
  if (scope.global && options.manifest) throw new Error('--manifest só vale para o projeto');
  // Replacing with nothing would drop every bundle without saving the manifest, and still report them as removed.
  if (options.replaceBundles && !bundles.length) throw new Error('Substituir os bundles do manifesto exige selecionar ao menos um bundle');
  const managed = !scope.global && (bundles.length > 0 || Boolean(options.manifest) || !names.length);
  let selection;
  let manifestVersion: Plan['manifest'];
  let save: (() => Promise<void>) | undefined;
  let droppedBundles: string[] = [];
  if (managed) {
    const path = resolve(scope.cwd, options.manifest ?? 'skills.yaml');
    const manifest = await readManifest(path);
    manifestVersion = { path, revision: manifest.revision };
    const selectedBundles = [...new Set(options.replaceBundles ? bundles : [...manifest.bundles, ...bundles])];
    if (selectedBundles.length && !selectedBundles.includes('core')) selectedBundles.unshift('core');
    droppedBundles = manifest.bundles.filter(b => !selectedBundles.includes(b));
    const selectedSkills = [...new Set([...manifest.skills, ...names])];
    selection = resolveSelection(catalog, { manifest: { ...manifest, bundles: selectedBundles, skills: selectedSkills } });
    if (bundles.length || names.length) save = () => saveManifest(path, manifest, selectedBundles, selectedSkills);
    if (!selection.length) throw new Error(`Nenhuma skill selecionada. Escolha --skill/--bundle ou crie ${path}`);
  } else selection = resolveSelection(catalog, { bundles, skills: names });
  const plan = installPlan(scope, selection, targets, method);
  if (manifestVersion) plan.manifest = manifestVersion;
  return { plan, save, droppedBundles };
}

async function managedExtras(catalog: Catalog, scope: Scope, manifestPath?: string): Promise<{ names: string[]; manifest: NonNullable<Plan['manifest']> }> {
  if (scope.global) throw new Error('A reconciliação só vale para o projeto');
  const path = resolve(scope.cwd, manifestPath ?? 'skills.yaml');
  if (!await exists(path)) throw new Error(`Manifesto não encontrado: ${path}`);
  const manifest = await readManifest(path);
  const required = new Set(resolveSelection(catalog, { manifest }).map(s => s.name));
  const names = Object.entries((await loadState(scope)).skills).filter(([name, skill]) => Object.keys(skill.targets).length > 0 && !required.has(name)).map(([name]) => name);
  return { names, manifest: { path, revision: manifest.revision } };
}

export async function extras(catalog: Catalog, scope: Scope, manifestPath?: string): Promise<string[]> {
  return (await managedExtras(catalog, scope, manifestPath)).names;
}

export async function prepareReconcile(catalog: Catalog, options: Options): Promise<{ extras: string[]; plan?: Plan }> {
  const scope = scopeFor(options);
  const { names, manifest } = await managedExtras(catalog, scope, options.manifest);
  const selected = values(options.skill);
  if (!selected.length) return { extras: names };
  for (const name of selected) if (!names.includes(name)) throw new Error(`${name} não é um extra gerenciado fora do manifesto`);
  const plan = await managedPlan('remove', scope, catalog, selected, options.agent?.length ? validateAgents(values(options.agent)) : undefined);
  // The extras shown in the preview come from this revision; executePlan aborts under the lock if it changed.
  plan.manifest = manifest;
  return { extras: names, plan };
}

export type InstalledStatus = 'installed' | 'modified' | 'missing';

// The status value is the --json contract; only the text shown on screen is translated.
export const statusLabel: Record<InstalledStatus, string> = { installed: 'instalada', modified: 'modificada', missing: 'ausente' };

export async function installedRows(scope: Scope, filter?: Agent[], catalog?: Catalog) {
  const state = await loadState(scope);
  const rows = await Promise.all(Object.entries(state.skills).map(async ([name, skill]) => {
    const entries = Object.entries(skill.targets).filter(([key]) => !filter || filter.includes(key as Agent));
    const targets = await Promise.all(entries.map(async ([key, value]) => {
      const agent = key as Agent;
      const path = targetPath(scope, agent, name);
      const hash = await directoryHash(path);
      return { agent, method: value!.method, path, status: (hash === null ? 'missing' : hash === value!.hash ? 'installed' : 'modified') as InstalledStatus };
    }));
    const requirements = skill.origin === 'catalog' ? catalog?.skills.find(s => s.name === name)?.requirements ?? null : null;
    return { name, source: skill.source, origin: skill.origin, targets, requirements, runtime: requirementInfo(requirements) };
  }));
  return rows.filter(row => row.targets.length);
}

export async function runCommand(action: string, options: Options, loaded?: Catalog): Promise<void> {
  const catalog = loaded ?? await loadCatalog(options.catalog);
  const scope = scopeFor(options);
  const targetAgents = options.agent?.length ? validateAgents(values(options.agent)) : undefined;
  if (options.method && !['copy', 'symlink'].includes(options.method)) throw new Error('O método deve ser copy ou symlink');
  if (options.global && options.manifest) throw new Error('--manifest só vale para o projeto');
  if (action === 'list') {
    const rows = options.available ? catalog.skills.map(s => ({ ...s, runtime: requirementInfo(s.requirements) })) : await installedRows(scope, targetAgents, catalog);
    if (options.json) console.log(JSON.stringify(rows, null, 2));
    else {
      for (const row of rows) {
        console.log('targets' in row ? `${row.name} · ${row.targets.map(t => `${t.agent} (${statusLabel[t.status]}, ${t.method})`).join(', ')}` : `${row.name} [${row.bundles.join(', ')}] · ${summarizeDescription(row.description)}`);
        console.log(row.runtime.platformStatus === 'unknown' ? `  ${row.runtime.summary}` : `  ${row.runtime.summary} · ${row.runtime.notice}`);
      }
      if (rows.some(row => row.runtime.platformStatus === 'unknown')) console.log(`\n${unknownNotice}`);
      if (!rows.length) console.log('Nenhuma skill gerenciada pela Colibri neste escopo. Use list --available para ver o catálogo.');
    }
    return;
  }
  let plan: Plan;
  let save: (() => Promise<void>) | undefined;
  let droppedBundles: string[] = [];
  if (action === 'install') ({ plan, save, droppedBundles } = await prepareInstall(catalog, options));
  else if (action === 'reconcile') {
    const reconcile = await prepareReconcile(catalog, options);
    if (!reconcile.plan) {
      if (options.json) console.log(JSON.stringify(reconcile.extras.map(name => ({ name })), null, 2));
      else console.log(reconcile.extras.length ? `Extras gerenciados: ${reconcile.extras.join(', ')}\nEscolha --skill <nomes> para remover extras específicos.` : 'Nenhum extra gerenciado fora do manifesto.');
      return;
    }
    plan = reconcile.plan;
  } else if (action === 'update' || action === 'remove') plan = await managedPlan(action, scope, catalog, values(options.skill), targetAgents);
  else throw new Error(`Ação desconhecida: ${action}`);
  if (options.json && options.dryRun) { console.log(JSON.stringify(plan, null, 2)); return; }
  if (!options.json) console.log(preview(plan));
  if (!options.json && droppedBundles.length) console.log(`Serão removidos do manifesto: ${droppedBundles.join(', ')}. As skills deles continuam instaladas até você rodar reconcile.`);
  if (options.dryRun) { console.log('Simulação: nenhum arquivo foi alterado.'); return; }
  if (!options.yes) {
    if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error('A confirmação exige um terminal. Revise com --dry-run e depois passe --yes.');
    const confirmed = await p.confirm({ message: options.force ? 'Aplicar estas alterações, substituindo os conflitos (--force)?' : 'Aplicar estas alterações?', active: 'Sim', inactive: 'Não', initialValue: false });
    if (p.isCancel(confirmed) || !confirmed) { p.cancel('Cancelado. Nenhum arquivo foi alterado.'); return; }
  }
  const result = await executePlan(plan, options.force, save);
  if (options.json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`${result.added} adicionadas · ${result.updated} atualizadas · ${result.unchanged} sem alteração · ${result.removed} removidas`);
    if (droppedBundles.length) console.log(`Removidos do manifesto: ${droppedBundles.join(', ')}. As skills deles continuam instaladas até você rodar reconcile.`);
  }
}
