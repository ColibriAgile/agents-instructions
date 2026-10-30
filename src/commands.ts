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
import { requirementInfo } from './requirements.js';

export interface Options {
  cwd?: string; catalog?: string; global?: boolean; agent?: string[]; skill?: string[]; bundle?: string[];
  method?: Method; manifest?: string; yes?: boolean; force?: boolean; dryRun?: boolean; json?: boolean; available?: boolean;
}

export const values = (items?: string[]): string[] => [...new Set((items ?? []).flatMap(i => i.split(',')).filter(Boolean))];
export const scopeFor = (options: Options): Scope => ({ cwd: resolve(options.cwd ?? '.'), global: options.global ?? false });

export async function prepareInstall(catalog: Catalog, options: Options): Promise<{ plan: Plan; save?: () => Promise<void> }> {
  const scope = scopeFor(options);
  const state = await loadState(scope);
  const targets = validateAgents(values(options.agent?.length ? options.agent : state.preferences?.agents));
  const bundles = values(options.bundle);
  const names = values(options.skill);
  const method = options.method ?? state.preferences?.method ?? 'copy';
  if (!['copy', 'symlink'].includes(method)) throw new Error('Method must be copy or symlink');
  if (scope.global && options.manifest) throw new Error('--manifest is project-only');
  const managed = !scope.global && (bundles.length > 0 || Boolean(options.manifest) || !names.length);
  let selection;
  let manifestVersion: Plan['manifest'];
  let save: (() => Promise<void>) | undefined;
  if (managed) {
    const path = resolve(scope.cwd, options.manifest ?? 'skills.yaml');
    const manifest = await readManifest(path);
    manifestVersion = { path, revision: manifest.revision };
    const selectedBundles = [...new Set([...manifest.bundles, ...bundles])];
    if (selectedBundles.length && !selectedBundles.includes('core')) selectedBundles.unshift('core');
    const selectedSkills = [...new Set([...manifest.skills, ...names])];
    selection = resolveSelection(catalog, { manifest: { ...manifest, bundles: selectedBundles, skills: selectedSkills } });
    if (bundles.length || names.length) save = () => saveManifest(path, manifest, selectedBundles, selectedSkills);
    if (!selection.length) throw new Error(`No skills selected. Choose --skill/--bundle, or create ${path}`);
  } else selection = resolveSelection(catalog, { bundles, skills: names });
  const plan = installPlan(scope, selection, targets, method);
  if (manifestVersion) plan.manifest = manifestVersion;
  return { plan, save };
}

async function managedExtras(catalog: Catalog, scope: Scope, manifestPath?: string): Promise<{ names: string[]; manifest: NonNullable<Plan['manifest']> }> {
  if (scope.global) throw new Error('Reconciliation is project-only');
  const path = resolve(scope.cwd, manifestPath ?? 'skills.yaml');
  if (!await exists(path)) throw new Error(`Manifest not found: ${path}`);
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
  for (const name of selected) if (!names.includes(name)) throw new Error(`${name} is not a managed extra outside the manifest`);
  const plan = await managedPlan('remove', scope, catalog, selected, options.agent?.length ? validateAgents(values(options.agent)) : undefined);
  // The extras shown in the preview come from this revision; executePlan aborts under the lock if it changed.
  plan.manifest = manifest;
  return { extras: names, plan };
}

export async function installedRows(scope: Scope, filter?: Agent[], catalog?: Catalog) {
  const state = await loadState(scope);
  const rows = [];
  for (const [name, skill] of Object.entries(state.skills)) {
    const targets = [];
    for (const [key, value] of Object.entries(skill.targets)) {
      const agent = key as Agent;
      if (filter && !filter.includes(agent)) continue;
      const path = targetPath(scope, agent, name);
      const hash = await directoryHash(path);
      targets.push({ agent, method: value!.method, path, status: hash === null ? 'missing' : hash === value!.hash ? 'installed' : 'modified' });
    }
    const requirements = skill.origin === 'catalog' ? catalog?.skills.find(s => s.name === name)?.requirements ?? null : null;
    if (targets.length) rows.push({ name, source: skill.source, origin: skill.origin, targets, requirements, runtime: requirementInfo(requirements) });
  }
  return rows;
}

export async function runCommand(action: string, options: Options): Promise<void> {
  const catalog = await loadCatalog(options.catalog);
  const scope = scopeFor(options);
  const targetAgents = options.agent?.length ? validateAgents(values(options.agent)) : undefined;
  if (options.method && !['copy', 'symlink'].includes(options.method)) throw new Error('Method must be copy or symlink');
  if (options.global && options.manifest) throw new Error('--manifest is project-only');
  if (action === 'list') {
    const rows = options.available ? catalog.skills.map(s => ({ ...s, runtime: requirementInfo(s.requirements) })) : await installedRows(scope, targetAgents, catalog);
    if (options.json) console.log(JSON.stringify(rows, null, 2));
    else {
      for (const row of rows) {
        console.log('targets' in row ? `${row.name} · ${row.targets.map(t => `${t.agent} (${t.status}, ${t.method})`).join(', ')}` : `${row.name} [${row.bundles.join(', ')}] · ${row.description}`);
        console.log(`  ${row.runtime.summary} · ${row.runtime.notice}`);
      }
      if (!rows.length) console.log('No Colibri-managed skills in this scope. Use list --available to browse the catalog.');
    }
    return;
  }
  let plan: Plan;
  let save: (() => Promise<void>) | undefined;
  if (action === 'install') ({ plan, save } = await prepareInstall(catalog, options));
  else if (action === 'reconcile') {
    const reconcile = await prepareReconcile(catalog, options);
    if (!reconcile.plan) {
      if (options.json) console.log(JSON.stringify(reconcile.extras.map(name => ({ name })), null, 2));
      else console.log(reconcile.extras.length ? `Managed extras: ${reconcile.extras.join(', ')}\nChoose --skill <names> to remove specific extras.` : 'No managed extras outside the manifest.');
      return;
    }
    plan = reconcile.plan;
  } else if (action === 'update' || action === 'remove') plan = await managedPlan(action, scope, catalog, values(options.skill), targetAgents);
  else throw new Error(`Unknown action: ${action}`);
  if (options.json && options.dryRun) { console.log(JSON.stringify(plan, null, 2)); return; }
  if (!options.json) console.log(preview(plan));
  if (options.dryRun) { console.log('Dry run: no files changed.'); return; }
  if (!options.yes) {
    if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error('Confirmation requires a terminal. Review --dry-run, then pass --yes.');
    const confirmed = await p.confirm({ message: options.force ? 'Apply these changes, replacing conflicts (--force)?' : 'Apply these changes?', initialValue: false });
    if (p.isCancel(confirmed) || !confirmed) { p.cancel('Cancelled. No files changed.'); return; }
  }
  const result = await executePlan(plan, options.force, save);
  if (options.json) console.log(JSON.stringify(result, null, 2));
  else console.log(`${result.added} added · ${result.updated} updated · ${result.unchanged} unchanged · ${result.removed} removed`);
}
