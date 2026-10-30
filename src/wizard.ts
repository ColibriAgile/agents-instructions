import * as p from '@clack/prompts';
import { agents } from './agents.js';
import type { Agent, Method } from './agents.js';
import { loadCatalog } from './catalog.js';
import { extras, installedRows, runCommand, scopeFor } from './commands.js';
import type { Options } from './commands.js';
import { loadState } from './storage.js';
import { readManifest } from './manifest.js';
import { resolve } from 'node:path';
import { requirementInfo, bundleRequirementHint } from './requirements.js';

class Cancelled extends Error {}
function answer<T>(value: T): Exclude<T, symbol> {
  if (p.isCancel(value)) throw new Cancelled();
  return value as Exclude<T, symbol>;
}

export async function wizard(initial: Options = {}, initialAction?: string): Promise<void> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error('The wizard requires a terminal. Run colibri-skills --help for non-interactive commands.');
  try {
    p.intro('Colibri · Agent skills');
    const catalog = await loadCatalog(initial.catalog);
    const action = initialAction ?? answer(await p.select({ message: 'Choose action', options: [
      { value: 'install', label: 'Install skills' }, { value: 'update', label: 'Update installed skills' },
      { value: 'remove', label: 'Remove installed skills' }, { value: 'list', label: 'List installed skills' },
      { value: 'reconcile', label: 'Reconcile project manifest' },
    ] }));
    const global = action === 'reconcile' ? false : answer(await p.select({ message: 'Scope', options: [
      { value: false, label: 'Local', hint: `project: ${resolve(initial.cwd ?? '.')}` },
      { value: true, label: 'Global', hint: 'current user home' },
    ], initialValue: initial.global ?? false }));
    const options: Options = { ...initial, global };
    const scope = scopeFor(options);
    const state = await loadState(scope);
    const choices = action === 'install' ? Object.keys(agents) as Agent[] : [...new Set((await installedRows(scope)).flatMap(s => s.targets.map(t => t.agent)))];
    if (!choices.length) { p.outro('No Colibri-managed skills in this scope.'); return; }
    options.agent = answer(await p.autocompleteMultiselect<Agent>({
      message: 'Choose agents', placeholder: 'Type to search agents...', required: true,
      options: choices.map(value => ({ value, label: agents[value].label, hint: agents[value].local })),
      initialValues: action === 'install' ? (state.preferences?.agents ?? []).filter(a => choices.includes(a)) : choices,
    }));
    if (action === 'list') { await runCommand(action, options); p.outro('Done.'); return; }
    if (action === 'install') {
      const mode = answer(await p.select({ message: 'Browse skills', options: [
        { value: 'bundles', label: 'Select bundles', hint: 'grouped by stack and topic' },
        { value: 'search', label: 'Search individual skills', hint: 'ad hoc installation' },
        ...(!global ? [{ value: 'manifest', label: 'Install from skills.yaml' }] : []),
      ] }));
      if (mode === 'bundles') {
        const manifest = !global ? await readManifest(resolve(scope.cwd, options.manifest ?? 'skills.yaml')) : undefined;
        options.bundle = answer(await p.autocompleteMultiselect<string>({ message: 'Choose bundles', placeholder: 'Search stack or topic...', required: true,
          options: Object.entries(catalog.bundles).filter(([name]) => global || name !== 'core').map(([value, b]) => ({ value, label: `${value} · ${bundleRequirementHint(catalog, value)}`, hint: `${b.skills.length} skills · ${b.description}` })),
          initialValues: (manifest?.bundles ?? []).filter(b => b !== 'core' && Object.hasOwn(catalog.bundles, b)),
        }));
        if (!global) p.log.info('core is included in project manifests. Existing bundles and external sources are preserved.');
      } else if (mode === 'search') {
        const bundle = answer(await p.select({ message: 'Category filter', options: [
          { value: '*', label: 'All skills' }, ...Object.entries(catalog.bundles).map(([value, b]) => ({ value, label: value, hint: b.description })),
        ] }));
        options.skill = answer(await p.autocompleteMultiselect<string>({ message: 'Choose skills', placeholder: 'Type a skill name...', required: true,
          options: catalog.skills.filter(s => bundle === '*' || s.bundles.includes(bundle)).map(s => ({ value: s.name, label: `${s.name} · ${requirementInfo(s.requirements).summary}`, hint: s.description })),
        }));
      }
      options.method = answer(await p.select<Method>({ message: 'Installation method', initialValue: state.preferences?.method ?? 'copy', options: [
        { value: 'copy', label: 'Copy (recommended)', hint: 'independent copies' },
        { value: 'symlink', label: 'Symlink', hint: 'persistent canonical copy; may fall back to copy' },
      ] }));
    } else {
      const rows = await installedRows(scope, options.agent as Agent[], catalog);
      const extraNames = action === 'reconcile' ? new Set(await extras(catalog, scope, options.manifest)) : undefined;
      const available = rows.filter(s => !extraNames || extraNames.has(s.name));
      if (!available.length) { p.outro('No matching managed skills.'); return; }
      options.skill = answer(await p.autocompleteMultiselect<string>({ message: action === 'update' ? 'Choose skills to update' : 'Choose skills to remove', required: true,
        options: available.map(s => ({ value: s.name, label: `${s.name} · ${s.runtime.summary}`, hint: s.targets.map(t => `${t.agent}: ${t.status}`).join(', ') })),
      }));
    }
    await runCommand(action, options);
    p.outro('Done.');
  } catch (error) {
    if (error instanceof Cancelled) { p.cancel('Cancelled. No files changed.'); return; }
    throw error;
  }
}
