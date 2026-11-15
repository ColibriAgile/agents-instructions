import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync, realpathSync } from 'node:fs';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const entry = resolve('bin/colibri-skills.mjs');
const folders = ['.agents/skills', '.claude/skills', '.windsurf/skills'];
const same = (a, b) => realpathSync(a).toLowerCase() === realpathSync(b).toLowerCase();

/** A test catalog (a clone), a Git project and a sources cache, all in one temp folder. */
async function setup(t, manifest) {
  const base = await mkdtemp(join(tmpdir(), 'colibri links '));
  t.after(() => rm(base, { recursive: true, force: true }));
  const catalog = join(base, 'catalog');
  const project = join(base, 'project');
  await mkdir(join(catalog, 'SKILLS'), { recursive: true });
  await writeFile(join(catalog, 'bundles.yaml'), [
    '# Catálogo de teste', 'repo: test/catalog', '', 'bundles:', '  core:', '    description: Todo projeto.', '    skills:', '      - alpha', '      - beta',
    '', '  # Front ends', '  web:', '    description: Front ends web.', '    skills:', '      - gamma', '',
  ].join('\n'));
  for (const name of ['alpha', 'beta', 'gamma', 'delta']) {
    await mkdir(join(catalog, 'SKILLS', name), { recursive: true });
    await writeFile(join(catalog, 'SKILLS', name, 'SKILL.md'), `---\nname: ${name}\ndescription: Skill ${name}.\n---\nCorpo\n`);
  }
  await mkdir(project, { recursive: true });
  spawnSync('git', ['-C', project, 'init', '-q']);
  if (manifest !== undefined) await writeFile(join(project, 'skills.yaml'), manifest);
  const env = { ...process.env, COLIBRI_SKILLS_SOURCES: join(base, 'sources') };
  const run = (...args) => spawnSync(process.execPath, [entry, ...args, '--catalog', catalog], { cwd: project, encoding: 'utf8', env });
  const states = () => Object.fromEntries(JSON.parse(run('list', '--json').stdout).map(r => [r.name, r.state]));
  return { base, catalog, project, run, states, env };
}

test('P1: list mostra os estados em pt-BR e o --json mantém os valores em inglês', async t => {
  const { run, states, project } = await setup(t, 'bundles:\n  - core\n');
  assert.deepEqual(states(), { alpha: 'missing', beta: 'missing' });
  const screen = run('list');
  assert.equal(screen.status, 0, screen.stderr);
  assert.match(screen.stdout, /alpha · faltando \[core\]/);
  assert.match(screen.stdout, /faltando: o skills\.yaml pede a skill, mas falta um link/);
  assert.doesNotMatch(screen.stdout, /missing/);
  // A read writes nothing in the project.
  assert.deepEqual((await readdir(project)).sort(), ['.git', 'skills.yaml']);
});

test('P2: install cria os 3 links de cada skill, o Git não vê os links e o clone não muda', async t => {
  const { run, states, project, catalog } = await setup(t, 'bundles:\n  - core\n');
  const before = await readFile(join(catalog, 'SKILLS', 'alpha', 'SKILL.md'), 'utf8');
  const result = run('install', '--yes');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Vincular: alpha, beta/);
  assert.match(result.stdout, /2 vinculadas · 0 links removidos/);
  assert.deepEqual(states(), { alpha: 'linked', beta: 'linked' });
  for (const folder of folders) for (const name of ['alpha', 'beta']) {
    const path = join(project, folder, name);
    assert.ok(lstatSync(path).isSymbolicLink(), `${folder}/${name} é um link`); // a junction on win32
    assert.ok(same(path, join(catalog, 'SKILLS', name)));
  }
  assert.equal(spawnSync('git', ['-C', project, 'status', '--porcelain', '-uall'], { encoding: 'utf8' }).stdout.trim(), '?? skills.yaml');
  assert.equal(await readFile(join(catalog, 'SKILLS', 'alpha', 'SKILL.md'), 'utf8'), before);
  // An edit in the clone shows in the project at once.
  const edited = before.replace('Corpo', 'novo texto');
  await writeFile(join(catalog, 'SKILLS', 'alpha', 'SKILL.md'), edited);
  assert.equal(await readFile(join(project, '.claude/skills/alpha/SKILL.md'), 'utf8'), edited);
  assert.match(run('install', '--yes').stdout, /Nada a fazer/);
});

test('P3: install -b cria o skills.yaml com o core; --replace troca os bundles e remove os links que sobram', async t => {
  const { run, states, project } = await setup(t);
  assert.equal(run('install', '--bundle', 'web', '--yes').status, 0);
  assert.equal(await readFile(join(project, 'skills.yaml'), 'utf8'), 'bundles:\n  - core\n  - web\n');
  assert.deepEqual(states(), { alpha: 'linked', beta: 'linked', gamma: 'linked' });
  await writeFile(join(project, 'skills.yaml'), '# equipe\nbundles:\n  - core\n  - web\nteam: colibri\n');
  const replaced = run('install', '--bundle', 'core', '--replace', '--yes');
  assert.equal(replaced.status, 0, replaced.stderr);
  assert.match(replaced.stdout, /Remover links: gamma/);
  assert.deepEqual(states(), { alpha: 'linked', beta: 'linked' });
  assert.equal(await readFile(join(project, 'skills.yaml'), 'utf8'), '# equipe\nbundles:\n  - core\nteam: colibri\n');
  const unknown = run('install', '--bundle', 'nope', '--yes');
  assert.equal(unknown.status, 1);
  assert.match(unknown.stderr, /Erro: Bundle desconhecido: nope/);
});

test('P4/P5: skill avulsa fica extra; com --keep entra em skills:; remove tira do manifesto e os links', async t => {
  const { run, states, project, catalog } = await setup(t, 'bundles:\n  - core\n');
  run('install', '--yes');
  assert.equal(run('install', '--skill', 'delta', '--yes').status, 0);
  assert.equal(states().delta, 'extra');
  assert.equal(await readFile(join(project, 'skills.yaml'), 'utf8'), 'bundles:\n  - core\n');
  assert.equal(run('install', '--skill', 'gamma', '--keep', '--yes').status, 0);
  assert.equal(await readFile(join(project, 'skills.yaml'), 'utf8'), 'bundles:\n  - core\nskills:\n  - gamma\n');
  assert.equal(states().gamma, 'linked');
  assert.match(run('list').stdout, /gamma · vinculada \[avulsa\]/);
  const removed = run('remove', '--skill', 'gamma,delta', '--yes');
  assert.equal(removed.status, 0, removed.stderr);
  assert.match(removed.stdout, /Remover links: gamma, delta/);
  assert.deepEqual(states(), { alpha: 'linked', beta: 'linked' });
  assert.equal(await readFile(join(project, 'skills.yaml'), 'utf8'), 'bundles:\n  - core\n');
  assert.ok(existsSync(join(catalog, 'SKILLS', 'gamma', 'SKILL.md')), 'a pasta da skill continua no clone');
  // A skill of a bundle is not removed by name: the bundle asks for it.
  const kept = run('remove', '--skill', 'alpha', '--yes');
  assert.match(kept.stdout, /Continuam vinculadas porque um bundle do projeto pede: alpha/);
  assert.equal(states().alpha, 'linked');
  const missing = run('remove', '--skill', 'zeta', '--yes');
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /Erro: Skill\(s\) que o projeto não tem: zeta/);
});

test('P6: cópias de uma instalação antiga viram links; a cópia editada vai para o backup e o lock some', async t => {
  const { run, states, project, catalog } = await setup(t, 'bundles:\n  - core\n');
  const hash = async dir => { // computeSkillFolderHash of the `skills` CLI, for a folder with one file
    const content = await readFile(join(dir, 'SKILL.md'));
    return createHash('sha256').update('SKILL.md').update('\0').update(String(content.length)).update('\0').update(content).digest('hex');
  };
  const lock = { version: 1, skills: {} };
  for (const name of ['alpha', 'beta']) {
    await cp(join(catalog, 'SKILLS', name), join(project, '.agents/skills', name), { recursive: true });
    await mkdir(join(project, '.claude/skills'), { recursive: true });
    await symlink(join(project, '.agents/skills', name), join(project, '.claude/skills', name), process.platform === 'win32' ? 'junction' : 'dir');
    lock.skills[name] = { source: 'test/catalog', sourceType: 'github', computedHash: await hash(join(project, '.agents/skills', name)) };
  }
  await writeFile(join(project, '.agents/skills/beta/SKILL.md'), 'editada à mão\n');
  await writeFile(join(project, 'skills-lock.json'), JSON.stringify(lock));
  await writeFile(join(project, '.colibri-skills.json'), JSON.stringify({ version: 1, skills: { alpha: {}, beta: {} } }));
  assert.deepEqual(states(), { alpha: 'copy', beta: 'copy' });
  assert.match(run('list').stdout, /alpha · cópia/);
  const result = run('install', '--yes');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Trocar cópia por link: alpha, beta/);
  assert.match(result.stdout, /Movidas para \.agents\/skills-backup \(tinham mudanças\): beta/);
  assert.deepEqual(states(), { alpha: 'linked', beta: 'linked' });
  assert.equal(await readFile(join(project, '.agents/skills-backup/beta/SKILL.md'), 'utf8'), 'editada à mão\n');
  assert.ok(!existsSync(join(project, '.agents/skills-backup/alpha')), 'a cópia sem mudanças não vai para o backup');
  assert.ok(!existsSync(join(project, 'skills-lock.json')) && !existsSync(join(project, '.colibri-skills.json')));
  assert.equal(readFileSync(join(catalog, 'SKILLS/beta/SKILL.md'), 'utf8').includes('editada'), false);
});

test('P7: conflito não muda sem --force; com --force -s a pasta vai para o backup', async t => {
  const { run, states, project } = await setup(t, 'bundles:\n  - core\n');
  await mkdir(join(project, '.claude/skills/alpha'), { recursive: true });
  await writeFile(join(project, '.claude/skills/alpha/SKILL.md'), 'minha versão\n');
  const first = run('install', '--yes');
  assert.equal(first.status, 0, first.stderr);
  assert.match(first.stdout, /Conflito \(o projeto tem uma pasta própria; use --force -s <skills> para substituir\): alpha/);
  assert.deepEqual(states(), { alpha: 'conflict', beta: 'linked' });
  assert.match(run('list').stdout, /alpha · conflito/);
  assert.equal(await readFile(join(project, '.claude/skills/alpha/SKILL.md'), 'utf8'), 'minha versão\n');
  const forced = run('install', '--force', '--skill', 'alpha', '--keep', '--yes');
  assert.equal(forced.status, 0, forced.stderr);
  assert.equal(states().alpha, 'linked');
  assert.equal(await readFile(join(project, '.agents/skills-backup/alpha/SKILL.md'), 'utf8'), 'minha versão\n');
});

test('P8/P9: --dry-run não altera arquivos; sem --yes fora de um terminal e sem Git a CLI explica em pt-BR', async t => {
  const { run, project, base, catalog, env } = await setup(t, 'bundles:\n  - core\n');
  const dry = run('install', '--bundle', 'web', '--dry-run');
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(dry.stdout, /skills\.yaml · bundles: core, web/);
  assert.match(dry.stdout, /Vincular: alpha, beta, gamma/);
  assert.match(dry.stdout, /Simulação: nenhum arquivo foi alterado\./);
  const plan = JSON.parse(run('install', '--bundle', 'web', '--dry-run', '--json').stdout);
  assert.equal(plan.action, 'install');
  assert.deepEqual(plan.link, ['alpha', 'beta', 'gamma']);
  assert.deepEqual(plan.manifest.bundles, ['core', 'web']);
  assert.deepEqual((await readdir(project)).sort(), ['.git', 'skills.yaml']);
  assert.equal(await readFile(join(project, 'skills.yaml'), 'utf8'), 'bundles:\n  - core\n');
  const confirm = run('install');
  assert.equal(confirm.status, 1);
  assert.match(confirm.stderr, /Erro: A confirmação exige um terminal\. Revise com --dry-run e depois passe --yes\./);
  assert.deepEqual((await readdir(project)).sort(), ['.git', 'skills.yaml']);
  const plain = join(base, 'sem git');
  await mkdir(plain);
  const noGit = spawnSync(process.execPath, [entry, 'list', '--catalog', catalog], { cwd: plain, encoding: 'utf8', env: { ...env, GIT_CEILING_DIRECTORIES: base } });
  assert.equal(noGit.status, 1);
  assert.match(noGit.stderr, /Erro: .* não está num repositório Git\. Rode git init no projeto, ou informe a pasta do projeto com --cwd\./);
});

test('P13: um erro do motor sai em pt-BR, e o --json mantém o código', async t => {
  const { run, project } = await setup(t, 'bundles:\n  - core\n');
  // A file where a link must go.
  await mkdir(join(project, '.windsurf/skills'), { recursive: true });
  await writeFile(join(project, '.windsurf/skills/alpha'), 'arquivo');
  const result = run('install', '--yes');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Erro: alpha: existe um arquivo com este nome na pasta de skills\./);
  const json = JSON.parse(run('install', '--yes', '--json').stdout);
  assert.ok(json.problems.some(p => p.code === 'is_file' && p.name === 'alpha'));
});

test('sources: uma skill de outro repositório é clonada no cache e vinculada', async t => {
  const { run, states, project, base } = await setup(t, 'bundles:\n  - core\n');
  // A URL has no spaces: the origin is in a folder of its own.
  const remote = await mkdtemp(join(tmpdir(), 'colibri-origin-'));
  t.after(() => rm(remote, { recursive: true, force: true }));
  const origin = join(remote, 'origin.git');
  const work = join(remote, 'work');
  await mkdir(join(work, 'skills', 'omega'), { recursive: true });
  await writeFile(join(work, 'skills', 'omega', 'SKILL.md'), '---\nname: omega\ndescription: Externa.\n---\n');
  const git = (dir, ...args) => spawnSync('git', ['-C', dir, ...args], { encoding: 'utf8' });
  git(work, 'init', '-q', '-b', 'main'); git(work, 'add', '-A');
  git(work, '-c', 'user.name=t', '-c', 'user.email=t@t.example', 'commit', '-qm', 'x');
  spawnSync('git', ['clone', '-q', '--bare', work, origin]);
  const url = `file://${origin.split('\\').join('/').replace(/^([A-Za-z]):/, '/$1:')}`;
  const result = run('install', '--skill', 'omega', '--repo', url, '--keep', '--yes');
  assert.equal(result.status, 0, result.stderr + result.stdout);
  assert.equal(states().omega, 'linked');
  assert.match(await readFile(join(project, 'skills.yaml'), 'utf8'), /sources:\n  - repo: file:\/\/.*\n    skills:\n      - omega\n/);
  assert.ok(realpathSync(join(project, '.claude/skills/omega')).toLowerCase().startsWith(realpathSync(join(base, 'sources')).toLowerCase()));
  const bad = run('install', '--skill', 'omega', '--repo', '--upload-pack=x', '--yes');
  assert.equal(bad.status, 1);
});
