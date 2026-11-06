import * as p from '@clack/prompts';
import { agents } from './agents.js';
import type { Agent, Method } from './agents.js';
import { loadCatalog } from './catalog.js';
import { extras, installedRows, runCommand, scopeFor, statusLabel } from './commands.js';
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
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error('O assistente exige um terminal. Rode colibri-skills --help para ver os comandos não interativos.');
  try {
    p.intro('Colibri · Skills de agentes');
    const catalog = await loadCatalog(initial.catalog);
    const action = initialAction ?? answer(await p.select({ message: 'Escolha a ação', options: [
      { value: 'install', label: 'Instalar skills' }, { value: 'update', label: 'Atualizar skills instaladas' },
      { value: 'remove', label: 'Remover skills instaladas' }, { value: 'list', label: 'Listar skills instaladas' },
      { value: 'reconcile', label: 'Reconciliar o manifesto do projeto' },
    ] }));
    const global = action === 'reconcile' ? false : answer(await p.select({ message: 'Escopo', options: [
      { value: false, label: 'Local', hint: `projeto: ${resolve(initial.cwd ?? '.')}` },
      { value: true, label: 'Global', hint: 'diretório pessoal do usuário atual' },
    ], initialValue: initial.global ?? false }));
    const options: Options = { ...initial, global };
    const scope = scopeFor(options);
    const state = await loadState(scope);
    // Read once: the later screens filter these rows in memory. executePlan still revalidates the state under the lock.
    const rows = action === 'install' ? [] : await installedRows(scope, undefined, catalog);
    const choices = action === 'install' ? Object.keys(agents) as Agent[] : [...new Set(rows.flatMap(s => s.targets.map(t => t.agent)))];
    if (!choices.length) { p.outro('Nenhuma skill gerenciada pela Colibri neste escopo.'); return; }
    options.agent = answer(await p.autocompleteMultiselect<Agent>({
      message: 'Escolha os agentes', placeholder: 'Digite para buscar agentes...', required: true,
      options: choices.map(value => ({ value, label: agents[value].label, hint: agents[value].local })),
      initialValues: action === 'install' ? (state.preferences?.agents ?? []).filter(a => choices.includes(a)) : choices,
    }));
    if (action === 'list') { await runCommand(action, options, catalog); p.outro('Concluído.'); return; }
    if (action === 'install') {
      const mode = answer(await p.select({ message: 'Navegar pelas skills', options: [
        { value: 'bundles', label: 'Selecionar bundles', hint: 'agrupados por stack e tema' },
        { value: 'search', label: 'Buscar skills individuais', hint: 'instalação avulsa' },
        ...(!global ? [{ value: 'manifest', label: 'Instalar a partir do skills.yaml' }] : []),
      ] }));
      if (mode === 'bundles') {
        const manifest = !global ? await readManifest(resolve(scope.cwd, options.manifest ?? 'skills.yaml')) : undefined;
        options.bundle = answer(await p.autocompleteMultiselect<string>({ message: 'Escolha os bundles', placeholder: 'Busque por stack ou tema...', required: true,
          options: Object.entries(catalog.bundles).filter(([name]) => global || name !== 'core').map(([value, b]) => ({ value, label: `${value} · ${bundleRequirementHint(catalog, value)}`, hint: `${b.skills.length} skills · ${b.description}` })),
          initialValues: (manifest?.bundles ?? []).filter(b => b !== 'core' && Object.hasOwn(catalog.bundles, b)),
        }));
        if (!global) {
          options.replaceBundles = true;
          p.log.info('O core já faz parte dos manifestos de projeto. Os bundles selecionados substituem os do manifesto; skills e fontes externas são preservadas.');
        }
      } else if (mode === 'search') {
        const bundle = answer(await p.select({ message: 'Filtro de categoria', options: [
          { value: '*', label: 'Todas as skills' }, ...Object.entries(catalog.bundles).map(([value, b]) => ({ value, label: value, hint: b.description })),
        ] }));
        options.skill = answer(await p.autocompleteMultiselect<string>({ message: 'Escolha as skills', placeholder: 'Digite o nome de uma skill...', required: true,
          options: catalog.skills.filter(s => bundle === '*' || s.bundles.includes(bundle)).map(s => ({ value: s.name, label: `${s.name} · ${requirementInfo(s.requirements).summary}`, hint: s.description })),
        }));
      }
      options.method = answer(await p.select<Method>({ message: 'Método de instalação', initialValue: state.preferences?.method ?? 'copy', options: [
        { value: 'copy', label: 'Copy (recomendado)', hint: 'cópias independentes' },
        { value: 'symlink', label: 'Symlink', hint: 'cópia canônica persistente; pode recorrer a copy' },
      ] }));
    } else {
      const chosen = new Set<Agent>(options.agent as Agent[]);
      const visible = rows.map(r => ({ ...r, targets: r.targets.filter(t => chosen.has(t.agent)) })).filter(r => r.targets.length);
      const extraNames = action === 'reconcile' ? new Set(await extras(catalog, scope, options.manifest)) : undefined;
      const available = visible.filter(s => !extraNames || extraNames.has(s.name));
      if (!available.length) { p.outro('Nenhuma skill gerenciada correspondente.'); return; }
      options.skill = answer(await p.autocompleteMultiselect<string>({ message: action === 'update' ? 'Escolha as skills a atualizar' : 'Escolha as skills a remover', required: true,
        options: available.map(s => ({ value: s.name, label: `${s.name} · ${s.runtime.summary}`, hint: s.targets.map(t => `${t.agent}: ${statusLabel[t.status]}`).join(', ') })),
      }));
    }
    await runCommand(action, options, catalog);
    p.outro('Concluído.');
  } catch (error) {
    if (error instanceof Cancelled) { p.cancel('Cancelado. Nenhum arquivo foi alterado.'); return; }
    throw error;
  }
}
