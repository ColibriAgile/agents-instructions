import * as p from '@clack/prompts';
import { loadCatalog } from './catalog.js';
import type { Catalog } from './catalog.js';
import { context, projectRoot, runCommand } from './commands.js';
import type { Options } from './commands.js';
import { engine } from './engine.js';
import type { Details, ProjectState } from './engine.js';
import { readManifest } from './manifest.js';
import { bundleRequirementHint, requirementInfo } from './requirements.js';
import { stateLabel } from './texts.js';
import { join } from 'node:path';

class Cancelled extends Error {}
function answer<T>(value: T): Exclude<T, symbol> {
  if (p.isCancel(value)) throw new Cancelled();
  return value as Exclude<T, symbol>;
}

const bundleOptions = (catalog: Catalog, withCore: boolean) => Object.entries(catalog.bundles).filter(([name]) => withCore || name !== 'core')
  .map(([value, b]) => ({ value, label: `${value} · ${bundleRequirementHint(catalog, value)}`, hint: `${b.skills.length} skills · ${b.description}` }));

/** The curation menu: the same actions as `colibri-skills catalog`. */
async function catalogMenu(options: Options, catalog: Catalog): Promise<void> {
  const details = await engine<Details>({ op: 'details', clone: catalog.root });
  const action = answer(await p.select({ message: 'Gerenciar o catálogo', options: [
    { value: 'orphans', label: 'Associar as skills sem bundle', hint: `${details.orphans.length} sem bundle` },
    { value: 'assign', label: 'Pôr skills num bundle' }, { value: 'unassign', label: 'Tirar skills de um bundle' },
    { value: 'bundle-delete', label: 'Apagar um bundle' }, { value: 'skill-delete', label: 'Apagar skills do clone' },
  ] }));
  const pickSkills = async (message: string, names: string[]) => answer(await p.autocompleteMultiselect<string>({
    message, placeholder: 'Digite o nome de uma skill...', required: true,
    options: names.map(name => { const s = details.skills.find(x => x.name === name)!; return { value: name, label: name, hint: s.bundles.join(', ') || 'sem bundle' }; }),
  }));
  const pickBundle = async (message: string, names: string[], allowNew: boolean) => answer(await p.select<string>({ message, options: [
    ...names.map(value => ({ value, label: value, hint: catalog.bundles[value]?.description })),
    ...(allowNew ? [{ value: '+', label: 'Bundle novo…' }] : []),
  ] }));
  const all = details.skills.map(s => s.name);
  if (action === 'orphans' || action === 'assign') {
    const candidates = action === 'orphans' ? details.orphans : all;
    if (!candidates.length) { p.outro('Todas as skills pertencem a pelo menos 1 bundle.'); return; }
    options.skill = await pickSkills('Escolha as skills', candidates);
    let bundle = await pickBundle('Bundle de destino', Object.keys(catalog.bundles), true);
    if (bundle === '+') {
      bundle = answer(await p.text({ message: 'Nome do bundle novo', placeholder: 'letras minúsculas, dígitos e -', validate: v => /^[a-z0-9][a-z0-9_-]*$/.test(v ?? '') ? undefined : 'Use letras minúsculas, dígitos, "-" e "_".' }));
      options.description = answer(await p.text({ message: 'Descrição do bundle', validate: v => v?.trim() ? undefined : 'Escreva uma descrição de uma linha.' }));
    }
    options.bundle = [bundle];
    await runCommand('catalog:assign', options, catalog);
  } else if (action === 'unassign') {
    const bundle = await pickBundle('Bundle de origem', Object.keys(catalog.bundles), false);
    options.bundle = [bundle];
    options.skill = await pickSkills('Skills a tirar do bundle', catalog.bundles[bundle]!.skills);
    await runCommand('catalog:unassign', options, catalog);
  } else if (action === 'bundle-delete') {
    options.bundle = [await pickBundle('Bundle a apagar', Object.keys(catalog.bundles).filter(b => b !== 'core'), false)];
    await runCommand('catalog:bundle-delete', options, catalog);
  } else {
    options.skill = await pickSkills('Skills a apagar do clone', all);
    await runCommand('catalog:skill-delete', options, catalog);
  }
}

export async function wizard(initial: Options = {}): Promise<void> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error('O assistente exige um terminal. Rode colibri-skills --help para ver os comandos não interativos.');
  try {
    p.intro('Colibri · Skills de agentes');
    const catalog = await loadCatalog(initial.catalog);
    const options: Options = { ...initial };
    const action = answer(await p.select({ message: 'Escolha a ação', options: [
      { value: 'install', label: 'Vincular as skills do projeto', hint: 'cria os links que faltam, troca cópias por links, remove os que sobram' },
      { value: 'bundles', label: 'Escolher os bundles do projeto' },
      { value: 'add', label: 'Adicionar skills avulsas' },
      { value: 'remove', label: 'Remover skills do projeto' },
      { value: 'list', label: 'Ver o estado das skills do projeto' },
      { value: 'update', label: 'Atualizar o clone do catálogo' },
      { value: 'catalog', label: 'Gerenciar o catálogo', hint: 'bundles de cada skill, skills sem bundle' },
    ] }));
    if (action === 'catalog') { await catalogMenu(options, catalog); p.outro('Concluído.'); return; }
    if (action === 'update' || action === 'list' || action === 'install') { await runCommand(action, options, catalog); p.outro('Concluído.'); return; }
    const project = projectRoot(options);
    if (action === 'bundles') {
      const manifest = await readManifest(join(project, 'skills.yaml'));
      options.bundle = answer(await p.autocompleteMultiselect<string>({ message: 'Escolha os bundles', placeholder: 'Busque por stack ou tema...', required: true,
        options: bundleOptions(catalog, false), initialValues: manifest.bundles.filter(b => b !== 'core' && Object.hasOwn(catalog.bundles, b)),
      }));
      options.replace = true;
      p.log.info('O core faz parte de todo projeto. Os bundles escolhidos substituem os do skills.yaml; as skills avulsas e as fontes externas ficam.');
      await runCommand('install', options, catalog);
    } else if (action === 'add') {
      const state = await engine<ProjectState>({ op: 'read', project, ...(await context(options, catalog)).base });
      const have = new Set(state.rows.map(r => r.name));
      const bundle = answer(await p.select({ message: 'Filtro de categoria', options: [
        { value: '*', label: 'Todas as skills' }, ...Object.entries(catalog.bundles).map(([value, b]) => ({ value, label: value, hint: b.description })),
      ] }));
      const candidates = catalog.skills.filter(s => !have.has(s.name) && (bundle === '*' || s.bundles.includes(bundle)));
      if (!candidates.length) { p.outro('O projeto já tem todas as skills deste filtro.'); return; }
      options.skill = answer(await p.autocompleteMultiselect<string>({ message: 'Escolha as skills', placeholder: 'Digite o nome de uma skill...', required: true,
        options: candidates.map(s => ({ value: s.name, label: `${s.name} · ${requirementInfo(s.requirements).summary}`, hint: s.description })),
        // A text that is part of a skill name shows only the skills with that name; other texts also search the descriptions.
        filter: (search, option) => {
          const text = search.trim().toLowerCase();
          return candidates.some(s => s.name.includes(text))
            ? String(option.value).includes(text)
            : `${option.label ?? ''} ${option.hint ?? ''}`.toLowerCase().includes(text);
        },
      }));
      options.keep = answer(await p.select({ message: 'Guardar no skills.yaml?', options: [
        { value: true, label: 'Sim', hint: 'a equipe recebe as mesmas skills' }, { value: false, label: 'Não', hint: 'só neste computador, como extra' },
      ] }));
      await runCommand('install', options, catalog);
    } else {
      const state = await engine<ProjectState>({ op: 'read', project, ...(await context(options, catalog)).base });
      const removable = state.rows.filter(r => r.state === 'extra' || r.state === 'stale' || r.from.includes('sources'));
      if (!removable.length) { p.outro('Nenhuma skill avulsa para remover. As skills de um bundle saem com "Escolher os bundles do projeto".'); return; }
      options.skill = answer(await p.autocompleteMultiselect<string>({ message: 'Escolha as skills a remover', required: true,
        options: removable.map(r => ({ value: r.name, label: r.name, hint: stateLabel[r.state] })),
      }));
      await runCommand('remove', options, catalog);
    }
    p.outro('Concluído.');
  } catch (error) {
    if (error instanceof Cancelled) { p.cancel('Cancelado. Nenhum arquivo foi alterado.'); return; }
    throw error;
  }
}
