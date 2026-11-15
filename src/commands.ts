import * as p from '@clack/prompts';
import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { parseDocument } from 'yaml';
import { isMissing, loadCatalog, packageRoot, readSkillMeta, skillName } from './catalog.js';
import type { Catalog } from './catalog.js';
import { engine, sourcesRoot } from './engine.js';
import type { Applied, Curated, Details, ProjectState, Row, SourceClone, State } from './engine.js';
import { atomicWrite, manifestText, readManifest, repoName, saveManifest } from './manifest.js';
import type { ManifestContent } from './manifest.js';
import { requirementInfo, summarizeDescription, unknownNotice } from './requirements.js';
import { catalogProblemText, changeText, problemText, stateHint, stateLabel } from './texts.js';

export interface Options {
  cwd?: string; catalog?: string; skill?: string[]; bundle?: string[]; yes?: boolean; force?: boolean; dryRun?: boolean;
  json?: boolean; available?: boolean; keep?: boolean; replace?: boolean; repo?: string; description?: string;
}

export const values = (items?: string[]): string[] => [...new Set((items ?? []).flatMap(i => i.split(',')).map(i => i.trim()).filter(Boolean))];

const slashed = (path: string) => path.split('\\').join('/');
const git = (dir: string, args: string[]) => spawnSync('git', ['-C', dir, ...args], { encoding: 'utf8', windowsHide: true });

/** The project is the Git root of --cwd: the links are hidden in its .git/info/exclude. */
export function projectRoot(options: Options): string {
  const cwd = resolve(options.cwd ?? '.');
  const result = git(cwd, ['rev-parse', '--show-toplevel']);
  if (result.error) throw new Error('O git não foi encontrado. Instale o Git e rode o comando de novo.');
  if (result.status !== 0) throw new Error(`${cwd} não está num repositório Git. Rode git init no projeto, ou informe a pasta do projeto com --cwd.`);
  return resolve(result.stdout.trim());
}

/**
 * The state of a project (`text`: a skills.yaml that is not written yet). A skills.yaml with `catalog:` is read
 * and changed only with the clone of that catalog: the engine reports another clone, and nothing is done.
 */
export async function readProject(project: string, ctx: Context, text?: string): Promise<ProjectState> {
  const state = await engine<ProjectState>({ op: 'read', project, ...ctx.base, ...(text === undefined ? {} : { manifestText: text }) });
  if (state.catalogProblem) throw new Error(catalogProblemText(state.catalogProblem));
  return state;
}

export interface Context { clone: string; catalog: Catalog; base: { clone: string; catalogRepo: string; sourcesRoot: string } }

export async function context(options: Options, loaded?: Catalog): Promise<Context> {
  const catalog = loaded ?? await loadCatalog(options.catalog);
  return { clone: catalog.root, catalog, base: { clone: catalog.root, catalogRepo: catalog.repo, sourcesRoot: sourcesRoot() } };
}

/** Asks before a change. --yes skips the question; without a terminal the question cannot be asked. */
async function confirmed(options: Options, message = 'Aplicar estas alterações?'): Promise<boolean> {
  if (options.yes) return true;
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error('A confirmação exige um terminal. Revise com --dry-run e depois passe --yes.');
  const answer = await p.confirm({ message, active: 'Sim', inactive: 'Não', initialValue: false });
  if (p.isCancel(answer) || !answer) { p.cancel('Cancelado. Nenhum arquivo foi alterado.'); return false; }
  return true;
}

const line = (label: string, names: string[]) => names.length ? [`${label}: ${names.join(', ')}`] : [];

/** Clones the repositories of `sources:` that have no clone yet. Returns the pt-BR errors. */
async function cloneSources(ctx: Context, repos: string[]): Promise<string[]> {
  const errors: string[] = [];
  for (const repo of [...new Set(repos)]) {
    const source = await engine<SourceClone>({ op: 'source', sourcesRoot: ctx.base.sourcesRoot, repo });
    if (!source.dir || !source.url) { errors.push(`${repo}: não é um repositório de skills (use owner/nome ou uma URL Git).`); continue; }
    if (source.exists) continue;
    await mkdir(dirname(source.dir), { recursive: true });
    const result = spawnSync('git', ['clone', '--quiet', '--', source.url, source.dir], { encoding: 'utf8', windowsHide: true });
    if (result.status !== 0) errors.push(`${repo}: não foi possível clonar (${(result.stderr || '').trim().split('\n').pop() ?? 'git clone falhou'}).`);
  }
  return errors;
}

function reportApplied(applied: Applied, options: Options): void {
  if (options.json) { console.log(JSON.stringify(applied, null, 2)); }
  else {
    const linked = applied.linked.length + applied.converted.length;
    const removed = applied.removed.length + applied.retired.length;
    console.log(`${linked} vinculadas · ${removed} links removidos · ${applied.deleted.length} pastas apagadas`);
    if (applied.backedUp.length) console.log(`Movidas para .agents/skills-backup (tinham mudanças): ${applied.backedUp.join(', ')}`);
    for (const problem of applied.problems) console.error(`Erro: ${problemText(problem)}`);
  }
  if (applied.problems.length) process.exitCode = 1;
}

// ---- list ---------------------------------------------------------------------------------------------------------

async function list(options: Options, ctx: Context): Promise<void> {
  if (options.available) {
    const rows = ctx.catalog.skills.map(s => ({ ...s, runtime: requirementInfo(s.requirements) }));
    if (options.json) { console.log(JSON.stringify(rows, null, 2)); return; }
    for (const row of rows) {
      console.log(`${row.name} [${row.bundles.join(', ') || 'sem bundle'}] · ${summarizeDescription(row.description)}`);
      console.log(row.runtime.platformStatus === 'unknown' ? `  ${row.runtime.summary}` : `  ${row.runtime.summary} · ${row.runtime.notice}`);
    }
    if (rows.some(row => row.runtime.platformStatus === 'unknown')) console.log(`\n${unknownNotice}`);
    return;
  }
  const project = projectRoot(options);
  const state = await readProject(project, ctx);
  // The declared requirements are of the catalog: a skill of another repository has none.
  const rows = state.rows.map(row => {
    const requirements = row.repo.toLowerCase() === ctx.catalog.repo.toLowerCase() ? ctx.catalog.skills.find(s => s.name === row.name)?.requirements ?? null : null;
    return { ...row, requirements, runtime: requirementInfo(requirements) };
  });
  if (options.json) { console.log(JSON.stringify(rows, null, 2)); return; }
  console.log(`Projeto: ${slashed(project)}\nClone: ${slashed(ctx.clone)}`);
  if (!state.manifest) console.log('Sem skills.yaml: as skills vinculadas deste projeto são extras.');
  for (const row of rows) {
    const origin = row.from.length ? row.from.map(f => f === 'sources' ? 'avulsa' : f).join(', ') : row.repo && row.state !== 'local' ? row.repo : '';
    console.log(`${row.name} · ${stateLabel[row.state]}${origin ? ` [${origin}]` : ''}`);
    if (row.requirements) console.log(`  ${row.runtime.summary} · ${row.runtime.notice}`);
  }
  if (!state.rows.length) console.log('Nenhuma skill neste projeto. Use install --bundle <nomes>, ou list --available para ver o catálogo.');
  const shown = new Set(state.rows.map(r => r.state).filter(s => s !== 'linked'));
  for (const s of shown) console.log(`  ${stateLabel[s]}: ${stateHint[s]}`);
  if (state.unknown.length) console.log(`O skills.yaml cita bundles que o catálogo não tem: ${state.unknown.join(', ')}`);
  if (state.retired) console.log(`${state.retired} link(s) em .codex/skills serão removidos pelo install (o Codex lê .agents/skills).`);
  if (state.lockError) console.log(`O skills-lock.json não é válido: ${state.lockError}`);
}

// ---- install and remove -------------------------------------------------------------------------------------------

interface InstallPlan {
  action: 'install' | 'remove';
  project: string;
  manifest: ManifestContent | null;
  link: string[]; remove: string[]; replace: string[]; extra: string[]; deleteLocal: string[];
  conflicts: string[]; absent: string[]; unsupported: string[]; kept: string[]; retired: number;
}

function previewPlan(plan: InstallPlan, rows: Row[], catalog?: Catalog): string {
  const state = (name: string): State | undefined => rows.find(r => r.name === name)?.state;
  const lines = [`Projeto: ${slashed(plan.project)}`];
  if (plan.manifest) {
    lines.push(`skills.yaml · bundles: ${plan.manifest.bundles.join(', ') || '(nenhum)'}`);
    if (plan.manifest.skills.length) lines.push(`skills.yaml · skills: ${plan.manifest.skills.join(', ')}`);
    for (const source of plan.manifest.sources) lines.push(`skills.yaml · ${source.repo}: ${source.skills.join(', ')}`);
  }
  lines.push(...line('Vincular', plan.link.filter(n => state(n) !== 'copy')));
  lines.push(...line('Trocar cópia por link', plan.link.filter(n => state(n) === 'copy')));
  lines.push(...line('Substituir a pasta do projeto por link (a pasta vai para .agents/skills-backup)', plan.replace));
  lines.push(...line('Remover links', plan.remove));
  lines.push(...line('Apagar pastas locais do projeto', plan.deleteLocal));
  if (plan.retired) lines.push(`Remover ${plan.retired} link(s) de .codex/skills`);
  lines.push(...line('Conflito (o projeto tem uma pasta própria; use --force -s <skills> para substituir)', plan.conflicts.filter(n => !plan.replace.includes(n))));
  lines.push(...line('Fora do clone (o skills.yaml pede, o catálogo não tem)', plan.absent));
  lines.push(...line('Sem clone (repositório não clonado)', plan.unsupported));
  lines.push(...line('Continuam vinculadas porque um bundle do projeto pede', plan.kept));
  // The declared requirements of the skills that this plan links. Declared only: no tool is checked.
  const added = [...plan.link, ...plan.replace].map(name => catalog?.skills.find(s => s.name === name)).filter(s => s !== undefined);
  for (const skill of added.filter(s => s.requirements)) { const info = requirementInfo(skill.requirements); lines.push(`${skill.name} · ${info.summary} · ${info.notice}`); }
  if (added.some(s => !s.requirements)) lines.push(unknownNotice);
  return lines.join('\n');
}

const hasWork = (plan: InstallPlan, changed: boolean) => changed || plan.link.length + plan.remove.length + plan.replace.length + plan.deleteLocal.length + plan.retired > 0;

async function install(options: Options, ctx: Context): Promise<void> {
  const project = projectRoot(options);
  const path = join(project, 'skills.yaml');
  const manifest = await readManifest(path);
  const bundles = values(options.bundle);
  const names = values(options.skill);
  names.forEach(skillName);
  for (const bundle of bundles) if (!Object.hasOwn(ctx.catalog.bundles, bundle)) throw new Error(`Bundle desconhecido: ${bundle}`);
  if (options.repo) repoName(options.repo);
  else for (const name of names) if (!ctx.catalog.skills.some(s => s.name === name)) throw new Error(`Skill desconhecida: ${name}`);
  if (options.replace && !bundles.length) throw new Error('Substituir os bundles do manifesto exige selecionar ao menos um bundle (--bundle)');
  if (options.repo && !names.length) throw new Error('--repo exige as skills do repositório (--skill)');

  const content: ManifestContent = { bundles: [...manifest.bundles], skills: [...manifest.skills], sources: manifest.sources.map(s => ({ repo: s.repo, skills: [...s.skills] })) };
  let changed = false;
  if (bundles.length) { content.bundles = [...new Set(['core', ...(options.replace ? [] : content.bundles), ...bundles])]; changed = true; }
  if (names.length && options.keep) {
    if (options.repo) {
      const repo = options.repo;
      let source = content.sources.find(s => s.repo.toLowerCase() === repo.toLowerCase());
      if (!source) { source = { repo, skills: [] }; content.sources.push(source); }
      source.skills.push(...names);
    } else content.skills.push(...names);
    if (!content.bundles.length) content.bundles = ['core'];
    changed = true;
  }
  const text = changed ? manifestText(manifest, content) : undefined;

  // The clones of the other repositories must be there before the state is read. A cache folder only.
  const repos = [...content.sources.map(s => s.repo), ...(options.repo ? [options.repo] : [])];
  const cloneErrors = options.dryRun ? [] : await cloneSources(ctx, repos);

  const state = await readProject(project, ctx, text);
  const of = (...states: State[]) => state.rows.filter(r => states.includes(r.state)).map(r => r.name);
  const extra = options.keep ? [] : names;
  const conflicts = of('conflict');
  const plan: InstallPlan = {
    action: 'install', project, manifest: changed ? content : null,
    link: [...new Set([...of('missing', 'copy'), ...extra.filter(n => !conflicts.includes(n))])],
    remove: of('stale').filter(n => !extra.includes(n)),
    replace: options.force ? conflicts.filter(n => !names.length || names.includes(n)) : [],
    extra, deleteLocal: [], conflicts, absent: of('absent'), unsupported: of('unsupported'), kept: [], retired: state.retired,
  };
  if (options.json && options.dryRun) { console.log(JSON.stringify(plan, null, 2)); return; }
  if (!options.json) {
    console.log(previewPlan(plan, state.rows, options.repo ? undefined : ctx.catalog));
    for (const error of cloneErrors) console.error(`Erro: ${error}`);
  }
  if (!hasWork(plan, changed)) {
    if (!options.json) console.log('Nada a fazer: os links do projeto estão em dia.');
    else console.log(JSON.stringify({ linked: [], removed: [], converted: [], backedUp: [], deleted: [], retired: [], errors: [], problems: [] }, null, 2));
    if (cloneErrors.length) process.exitCode = 1;
    return;
  }
  if (options.dryRun) { console.log('Simulação: nenhum arquivo foi alterado.'); return; }
  if (!await confirmed(options, plan.replace.length ? 'Aplicar estas alterações, substituindo as pastas em conflito (--force)?' : undefined)) return;
  if (text !== undefined) await saveManifest(path, manifest, text);
  const applied = await engine<Applied>({
    op: 'apply', project, ...ctx.base, link: plan.link, remove: plan.remove, replace: plan.replace, extra: plan.extra,
    ...(options.repo ? { repos: Object.fromEntries(names.map(n => [n, options.repo])) } : {}),
  });
  reportApplied(applied, options);
  if (cloneErrors.length) process.exitCode = 1;
}

async function remove(options: Options, ctx: Context): Promise<void> {
  const project = projectRoot(options);
  const names = values(options.skill);
  if (!names.length) throw new Error('Escolha as skills a remover (--skill)');
  names.forEach(skillName);
  const path = join(project, 'skills.yaml');
  const manifest = await readManifest(path);
  const content: ManifestContent = {
    bundles: [...manifest.bundles], skills: manifest.skills.filter(s => !names.includes(s)),
    sources: manifest.sources.map(s => ({ repo: s.repo, skills: s.skills.filter(n => !names.includes(n)) })),
  };
  const changed = manifest.revision !== null && (content.skills.length !== manifest.skills.length || content.sources.some((s, i) => s.skills.length !== manifest.sources[i]!.skills.length));
  const text = changed ? manifestText(manifest, content) : undefined;
  const state = await readProject(project, ctx, text);
  const row = (name: string) => state.rows.find(r => r.name === name);
  const unknown = names.filter(n => !row(n) && !manifest.skills.includes(n) && !manifest.sources.some(s => s.skills.includes(n)));
  if (unknown.length) throw new Error(`Skill(s) que o projeto não tem: ${unknown.join(', ')}`);
  const locals = names.filter(n => row(n)?.state === 'local');
  if (locals.length && !options.force) throw new Error(`${locals.join(', ')}: skill local do projeto. Passe --force para apagar a pasta.`);
  const plan: InstallPlan = {
    action: 'remove', project, manifest: changed ? content : null, link: [], replace: [], extra: [],
    remove: names.filter(n => ['stale', 'extra'].includes(row(n)?.state ?? '')), deleteLocal: locals,
    conflicts: [], absent: [], unsupported: [], retired: 0,
    kept: names.filter(n => ['linked', 'missing', 'copy', 'conflict'].includes(row(n)?.state ?? '')),
  };
  if (options.json && options.dryRun) { console.log(JSON.stringify(plan, null, 2)); return; }
  if (!options.json) console.log(previewPlan(plan, state.rows));
  if (!hasWork(plan, changed)) { if (!options.json) console.log('Nada a remover.'); return; }
  if (options.dryRun) { console.log('Simulação: nenhum arquivo foi alterado.'); return; }
  if (!await confirmed(options, locals.length ? 'Aplicar estas alterações, apagando as pastas locais (--force)?' : undefined)) return;
  if (text !== undefined) await saveManifest(path, manifest, text);
  reportApplied(await engine<Applied>({ op: 'apply', project, ...ctx.base, convert: false, remove: plan.remove, deleteLocal: plan.deleteLocal }), options);
}

// ---- update -------------------------------------------------------------------------------------------------------

/** Brings the clone of the catalog and the clones of the other repositories to their remotes. */
async function update(options: Options, ctx: Context): Promise<void> {
  const results: { repo: string; status: 'updated' | 'current' | 'skipped' | 'failed'; detail?: string }[] = [];
  const last = (text: string) => text.trim().split('\n').pop() ?? '';
  const dirty = git(ctx.clone, ['status', '--porcelain', '--untracked-files=no']).stdout.trim();
  if (git(ctx.clone, ['rev-parse', '--git-dir']).status !== 0) results.push({ repo: 'catalog', status: 'skipped', detail: 'a pasta do catálogo não é um clone Git' });
  else if (dirty) results.push({ repo: 'catalog', status: 'skipped', detail: 'o clone tem mudanças sem commit' });
  else if (options.dryRun) results.push({ repo: 'catalog', status: 'skipped', detail: 'simulação: git pull --ff-only' });
  else {
    const before = git(ctx.clone, ['rev-parse', 'HEAD']).stdout.trim();
    const pull = git(ctx.clone, ['pull', '--ff-only', '--quiet']);
    if (pull.status !== 0) results.push({ repo: 'catalog', status: 'failed', detail: last(pull.stderr) });
    else results.push({ repo: 'catalog', status: git(ctx.clone, ['rev-parse', 'HEAD']).stdout.trim() === before ? 'current' : 'updated' });
  }
  // The clones of the sources cache: <owner>/<name>, or one folder for a URL.
  const root = ctx.base.sourcesRoot;
  const clones: string[] = [];
  const isClone = async (dir: string) => stat(join(dir, '.git')).then(() => true, () => false);
  for (const first of await readdir(root, { withFileTypes: true }).catch(() => [])) {
    if (!first.isDirectory()) continue;
    const dir = join(root, first.name);
    if (await isClone(dir)) { clones.push(dir); continue; }
    for (const second of await readdir(dir, { withFileTypes: true }).catch(() => [])) if (second.isDirectory() && await isClone(join(dir, second.name))) clones.push(join(dir, second.name));
  }
  for (const dir of clones) {
    const repo = slashed(dir.slice(root.length + 1));
    if (options.dryRun) { results.push({ repo, status: 'skipped', detail: 'simulação: git fetch e git reset --hard origin/HEAD' }); continue; }
    const fetch = git(dir, ['fetch', '--quiet', '--prune', 'origin']);
    if (fetch.status !== 0) { results.push({ repo, status: 'failed', detail: last(fetch.stderr) }); continue; }
    git(dir, ['remote', 'set-head', 'origin', '--auto']);
    const behind = Number(git(dir, ['rev-list', '--count', 'HEAD..origin/HEAD']).stdout.trim()) || 0;
    if (!behind) { results.push({ repo, status: 'current' }); continue; }
    const reset = git(dir, ['reset', '--hard', '--quiet', 'origin/HEAD']);
    results.push(reset.status === 0 ? { repo, status: 'updated', detail: `${behind} commit(s)` } : { repo, status: 'failed', detail: last(reset.stderr) });
  }
  if (options.json) console.log(JSON.stringify(results, null, 2));
  else {
    const label = { updated: 'atualizado', current: 'em dia', skipped: 'não atualizado', failed: 'falhou' } as const;
    // 'catalog' is the value of the --json contract; the screen says it in pt-BR.
    for (const r of results) console.log(`${r.repo === 'catalog' ? 'catálogo' : r.repo} · ${label[r.status]}${r.detail ? ` (${r.detail})` : ''}`);
    console.log('Os projetos veem a versão nova na hora: os links apontam para estes clones.');
  }
  if (results.some(r => r.status === 'failed')) process.exitCode = 1;
}

// ---- the curation of the catalog ----------------------------------------------------------------------------------

export type CatalogAction = 'orphans' | 'assign' | 'unassign' | 'bundle-delete' | 'skill-delete';

/** Removes the entries of deleted skills from skill-requirements.yaml, keeping its comments. */
async function dropRequirements(clone: string, names: string[]): Promise<void> {
  const path = join(clone, 'skill-requirements.yaml');
  let text: string;
  try { text = await readFile(path, 'utf8'); }
  catch (error) { if (isMissing(error)) return; throw error; }
  const document = parseDocument(text);
  let changed = false;
  for (const name of names) if (document.deleteIn(['skills', name])) changed = true;
  if (changed) await atomicWrite(path, document.toString());
}

async function curation(action: CatalogAction, options: Options, ctx: Context): Promise<void> {
  if (action === 'orphans') {
    const details = await engine<Details>({ op: 'details', clone: ctx.clone });
    if (options.json) { console.log(JSON.stringify(details.orphans.map(name => ({ name })), null, 2)); return; }
    if (!details.orphans.length) { console.log('Todas as skills pertencem a pelo menos 1 bundle.'); return; }
    for (const name of details.orphans) console.log(`${name} · ${summarizeDescription(details.skills.find(s => s.name === name)?.desc ?? '')}`);
    console.log('\nUse catalog assign -s <skills> -b <bundles> para pôr cada uma num bundle.');
    return;
  }
  const names = values(options.skill);
  const bundles = values(options.bundle);
  names.forEach(skillName);
  const input: Record<string, unknown> = {};
  const preview: string[] = [];
  if (action === 'assign' || action === 'unassign') {
    if (!names.length || !bundles.length) throw new Error('Escolha as skills (--skill) e os bundles (--bundle)');
    const pairs = names.flatMap(skill => bundles.map(bundle => ({ skill, bundle })));
    input[action] = pairs;
    if (action === 'assign') {
      const created = bundles.filter(b => !Object.hasOwn(ctx.catalog.bundles, b));
      if (created.length && !options.description) throw new Error(`Bundle(s) que não existem: ${created.join(', ')}. Para criar, passe --description "<descrição>".`);
      if (created.length > 1) throw new Error('Crie um bundle novo por vez: --description vale para um bundle só.');
      if (created.length) { input.createBundle = [{ name: created[0], description: options.description }]; preview.push(`Bundle novo: ${created[0]} · ${options.description}`); }
    }
    preview.push(...pairs.map(pair => action === 'assign' ? `${pair.skill} → ${pair.bundle}` : `${pair.skill} fora de ${pair.bundle}`));
  } else if (action === 'bundle-delete') {
    if (!bundles.length) throw new Error('Escolha os bundles a apagar (--bundle)');
    input.deleteBundle = bundles;
    preview.push(...bundles.map(b => `Apagar o bundle ${b} (as pastas das skills ficam)`));
  } else {
    if (!names.length) throw new Error('Escolha as skills a apagar (--skill)');
    input.deleteSkill = names;
    preview.push(...names.map(n => `Apagar a pasta SKILLS/${n} e tirar a skill de todos os bundles`));
  }
  if (options.dryRun) {
    const simulated = await engine<Curated>({ op: 'curate', clone: ctx.clone, ...input, dryRun: true });
    if (options.json) { console.log(JSON.stringify(simulated, null, 2)); return; }
    console.log(preview.join('\n'));
    for (const problem of simulated.problems) console.error(`Erro: ${problemText(problem)}`);
    console.log('Simulação: nenhum arquivo foi alterado.');
    if (simulated.problems.length) process.exitCode = 1;
    return;
  }
  if (!options.json) console.log(`Catálogo: ${slashed(ctx.clone)}\n${preview.join('\n')}`);
  if (!await confirmed(options, action === 'skill-delete' ? 'Apagar estas skills do clone?' : undefined)) return;
  const result = await engine<Curated>({ op: 'curate', clone: ctx.clone, ...input });
  const deleted = result.changed.filter(c => c.action === 'delete_skill').map(c => c.skill!);
  if (deleted.length) await dropRequirements(ctx.clone, deleted);
  if (options.json) console.log(JSON.stringify(result, null, 2));
  else {
    for (const change of result.changed) console.log(changeText(change));
    if (!result.changed.length && !result.problems.length) console.log('Nada mudou: o catálogo já estava assim.');
    for (const problem of result.problems) console.error(`Erro: ${problemText(problem)}`);
    if (result.changed.length) console.log('O bundles.yaml mudou no clone, sem commit. Revise com git diff, faça commit e push.');
  }
  if (result.problems.length) process.exitCode = 1;
}

/** Copies skills of another repository into SKILLS/ of the clone. */
async function importSkills(repo: string, options: Options, ctx: Context): Promise<void> {
  repoName(repo);
  const names = values(options.skill);
  if (!names.length) throw new Error('Escolha as skills a trazer (--skill)');
  names.forEach(skillName);
  const exist: string[] = [];
  for (const name of names) if (await stat(join(ctx.clone, 'SKILLS', name)).then(() => true, () => false)) exist.push(name);
  if (exist.length && !options.force) throw new Error(`Já existe em SKILLS/: ${exist.join(', ')}. Passe --force para substituir.`);
  if (!options.json) console.log(`Trazer de ${repo} para ${slashed(join(ctx.clone, 'SKILLS'))}: ${names.join(', ')}${exist.length ? `\nSubstituir: ${exist.join(', ')}` : ''}`);
  if (options.dryRun) { console.log('Simulação: nenhum arquivo foi alterado.'); return; }
  if (!await confirmed(options)) return;
  // The engine validates the text and gives the URL. The clone goes to a temp folder: the clones of the sources
  // cache are what the linked projects see, and they change only with `update`.
  const source = await engine<SourceClone>({ op: 'source', sourcesRoot: ctx.base.sourcesRoot, repo });
  if (!source.url) throw new Error(`${repo}: não é um repositório de skills (use owner/nome ou uma URL Git).`);
  const temporary = await mkdtemp(join(tmpdir(), 'colibri-import-'));
  const imported: string[] = [];
  try {
    const cloned = spawnSync('git', ['-c', 'core.autocrlf=false', 'clone', '--quiet', '--depth', '1', '--', source.url, join(temporary, 'repo')], { encoding: 'utf8', windowsHide: true });
    if (cloned.status !== 0) throw new Error(`${repo}: não foi possível clonar (${(cloned.stderr || '').trim().split('\n').pop() ?? 'git clone falhou'}).`);
    const folders = await skillFolders(join(temporary, 'repo'));
    const missing = names.filter(n => !folders.has(n));
    if (missing.length) throw new Error(`${repo} não tem a(s) skill(s): ${missing.join(', ')}. Disponíveis: ${[...folders.keys()].sort().join(', ') || '(nenhuma)'}`);
    for (const name of names) {
      const from = folders.get(name)!;
      readSkillMeta(await readFile(join(from, 'SKILL.md'), 'utf8'), `${repo}/${name}`);
      const target = join(ctx.clone, 'SKILLS', name);
      await rm(target, { recursive: true, force: true });
      await cp(from, target, { recursive: true, filter: path => !/[\\/]\.git([\\/]|$)/.test(path) });
      imported.push(name);
    }
  } finally { await rm(temporary, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }); }
  if (options.json) console.log(JSON.stringify(imported.map(name => ({ name })), null, 2));
  else {
    console.log(`${imported.length} skill(s) trazidas para SKILLS/: ${imported.join(', ')}`);
    console.log(`Elas estão sem bundle. Use: catalog assign -s ${imported.join(',')} -b <bundle>`);
  }
}

/** The folders with a SKILL.md of a clone, by name (at most 4 levels down, as the engine). */
async function skillFolders(root: string, depth = 4, found = new Map<string, string>(), dir = root): Promise<Map<string, string>> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const name = dir.split(/[\\/]/).pop()!;
  if (dir !== root && entries.some(e => e.isFile() && e.name === 'SKILL.md') && !found.has(name)) found.set(name, dir);
  if (depth > 0) for (const e of entries) if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules') await skillFolders(root, depth - 1, found, join(dir, e.name));
  return found;
}

/** Creates agents/openai.yaml in each skill with `disable-model-invocation: true`, so Codex does not invoke it by itself. */
async function modelInvocation(options: Options, ctx: Context): Promise<void> {
  const results: { name: string; status: 'created' | 'exists' }[] = [];
  for (const skill of ctx.catalog.skills) {
    const text = await readFile(join(skill.path, 'SKILL.md'), 'utf8');
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? '';
    if (!/^\s*disable-model-invocation\s*:\s*true\s*$/im.test(frontmatter)) continue;
    const path = join(skill.path, 'agents', 'openai.yaml');
    if (await stat(path).then(() => true, () => false)) { results.push({ name: skill.name, status: 'exists' }); continue; }
    if (!options.dryRun) { await mkdir(dirname(path), { recursive: true }); await writeFile(path, 'policy:\n  allow_implicit_invocation: false\n'); }
    results.push({ name: skill.name, status: 'created' });
  }
  if (options.json) { console.log(JSON.stringify(results, null, 2)); return; }
  for (const r of results) console.log(`${r.name} · ${r.status === 'created' ? (options.dryRun ? 'seria criado' : 'criado') : 'já existe'}: agents/openai.yaml`);
  if (!results.length) console.log('Nenhuma skill tem disable-model-invocation: true.');
  if (options.dryRun) console.log('Simulação: nenhum arquivo foi alterado.');
}

// ---- entry --------------------------------------------------------------------------------------------------------

export async function runCommand(action: string, options: Options, loaded?: Catalog, argument?: string): Promise<void> {
  const ctx = await context(options, loaded);
  for (const warning of ctx.catalog.warnings) if (!options.json) console.error(`Aviso: ${warning}`);
  if (action === 'list') return list(options, ctx);
  if (action === 'install') return install(options, ctx);
  if (action === 'remove') return remove(options, ctx);
  if (action === 'update') return update(options, ctx);
  if (action === 'import') return importSkills(argument ?? '', options, ctx);
  if (action === 'model-invocation') return modelInvocation(options, ctx);
  if (action.startsWith('catalog:')) return curation(action.slice(8) as CatalogAction, options, ctx);
  throw new Error(`Ação desconhecida: ${action}`);
}

export { packageRoot };
