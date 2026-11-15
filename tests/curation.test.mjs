import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const entry = resolve('bin/colibri-skills.mjs');

/** A test catalog in a temp folder. The curation commands need no project. */
async function setup(t) {
  const base = await mkdtemp(join(tmpdir(), 'colibri-curation-'));
  t.after(() => rm(base, { recursive: true, force: true }));
  const catalog = join(base, 'catalog');
  await mkdir(join(catalog, 'SKILLS'), { recursive: true });
  await writeFile(join(catalog, 'bundles.yaml'), [
    '# Catálogo de teste', 'repo: test/catalog', '', 'bundles:', '  core:', '    description: Todo projeto.', '    skills:', '      - alpha',
    '', '  # Front ends', '  web:', '    description: Front ends web.', '    skills:', '      - gamma', '',
  ].join('\n'));
  for (const [name, extra] of [['alpha', ''], ['gamma', ''], ['delta', 'disable-model-invocation: true\n'], ['omega', '']]) {
    await mkdir(join(catalog, 'SKILLS', name), { recursive: true });
    await writeFile(join(catalog, 'SKILLS', name, 'SKILL.md'), `---\nname: ${name}\ndescription: Skill ${name}. Segunda frase.\n${extra}---\nCorpo\n`);
  }
  await writeFile(join(catalog, 'skill-requirements.yaml'), '# Requisitos\nversion: 1\nskills:\n  # nota de omega\n  omega:\n    tools: [Python 3]\n  alpha:\n    tools: [Git]\n');
  const env = { ...process.env, COLIBRI_SKILLS_SOURCES: join(base, 'sources') };
  const run = (...args) => spawnSync(process.execPath, [entry, ...args, '--catalog', catalog], { cwd: base, encoding: 'utf8', env });
  const yaml = () => readFile(join(catalog, 'bundles.yaml'), 'utf8');
  return { base, catalog, run, yaml, env };
}

test('P10: catalog orphans lista as skills sem bundle', async t => {
  const { run } = await setup(t);
  const screen = run('catalog', 'orphans');
  assert.equal(screen.status, 0, screen.stderr);
  assert.match(screen.stdout, /delta · Skill delta\./);
  assert.match(screen.stdout, /omega · Skill omega\./);
  assert.doesNotMatch(screen.stdout, /alpha ·/);
  assert.deepEqual(JSON.parse(run('catalog', 'orphans', '--json').stdout), [{ name: 'delta' }, { name: 'omega' }]);
});

test('P10: assign e unassign mudam o bundles.yaml linha a linha; um bundle novo exige --description', async t => {
  const { run, yaml } = await setup(t);
  const dry = run('catalog', 'assign', '-s', 'delta', '-b', 'web', '--dry-run');
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(dry.stdout, /delta → web/);
  assert.match(dry.stdout, /Simulação: nenhum arquivo foi alterado\./);
  assert.doesNotMatch(await yaml(), /delta/);
  const confirm = run('catalog', 'assign', '-s', 'delta', '-b', 'web');
  assert.equal(confirm.status, 1);
  assert.match(confirm.stderr, /Erro: A confirmação exige um terminal/);
  const assigned = run('catalog', 'assign', '-s', 'delta,omega', '-b', 'web', '--yes');
  assert.equal(assigned.status, 0, assigned.stderr);
  assert.match(assigned.stdout, /delta → web\nomega → web/);
  assert.match(assigned.stdout, /O bundles\.yaml mudou no clone, sem commit\./);
  const text = await yaml();
  assert.match(text, /^# Catálogo de teste\n/);
  assert.match(text, /  # Front ends\n  web:\n    description: Front ends web\.\n    skills:\n      - gamma\n      - delta\n      - omega\n/);
  assert.match(run('catalog', 'orphans').stdout, /Todas as skills pertencem a pelo menos 1 bundle\./);
  const missing = run('catalog', 'assign', '-s', 'delta', '-b', 'dados', '--yes');
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /Erro: Bundle\(s\) que não existem: dados\. Para criar, passe --description/);
  const created = run('catalog', 'assign', '-s', 'delta', '-b', 'dados', '--description', 'Dados: SQL e relatórios.', '--yes');
  assert.equal(created.status, 0, created.stderr);
  assert.match(created.stdout, /bundle novo: dados\ndelta → dados/);
  assert.match(await yaml(), /  dados:\n    description: "Dados: SQL e relatórios\."\n    skills:\n      - delta\n/);
  const out = run('catalog', 'unassign', '-s', 'delta', '-b', 'web', '--yes', '--json');
  assert.deepEqual(JSON.parse(out.stdout).changed, [{ action: 'unassign', skill: 'delta', bundle: 'web' }]);
  assert.doesNotMatch((await yaml()).split('dados:')[0], /delta/);
});

test('P10/P13: erros do motor saem em pt-BR; bundle-delete nunca apaga o core; skill-delete limpa os requisitos', async t => {
  const { run, yaml, catalog } = await setup(t);
  const bad = run('catalog', 'assign', '-s', 'inexistente', '-b', 'web', '--yes');
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /Erro: inexistente: o clone não tem uma pasta de skill com este nome\./);
  assert.equal(JSON.parse(run('catalog', 'assign', '-s', 'inexistente', '-b', 'web', '--yes', '--json').stdout).problems[0].code, 'no_skill');
  const core = run('catalog', 'bundle-delete', '-b', 'core', '--yes');
  assert.equal(core.status, 1);
  assert.match(core.stderr, /Erro: core: este bundle está em todos os projetos e não pode ser apagado\./);
  const web = run('catalog', 'bundle-delete', '-b', 'web', '--yes');
  assert.equal(web.status, 0, web.stderr);
  assert.match(web.stdout, /bundle apagado: web/);
  assert.doesNotMatch(await yaml(), /web:|Front ends web/);
  assert.ok(existsSync(join(catalog, 'SKILLS', 'gamma', 'SKILL.md')), 'as pastas das skills do bundle ficam');
  const deleted = run('catalog', 'skill-delete', '-s', 'omega,alpha', '--yes');
  assert.equal(deleted.status, 0, deleted.stderr);
  assert.match(deleted.stdout, /skill apagada: omega\nskill apagada: alpha/);
  assert.ok(!existsSync(join(catalog, 'SKILLS', 'omega')) && !existsSync(join(catalog, 'SKILLS', 'alpha')));
  assert.doesNotMatch(await yaml(), /alpha/);
  const requirements = await readFile(join(catalog, 'skill-requirements.yaml'), 'utf8');
  assert.doesNotMatch(requirements, /^\s*(omega|alpha):/m); // the entries are gone (a comment about one can stay)
  assert.match(requirements, /^# Requisitos\nversion: 1\n/);
  // The catalog still loads after the deletes.
  assert.equal(run('list', '--available', '--json').status, 0);
});

test('P11: import traz uma skill de outro repositório para SKILLS/', async t => {
  const { run, catalog, base } = await setup(t);
  const work = join(base, 'work');
  await mkdir(join(work, 'skills', 'externa'), { recursive: true });
  await writeFile(join(work, 'skills', 'externa', 'SKILL.md'), '---\nname: externa\ndescription: Externa.\n---\n');
  await writeFile(join(work, 'skills', 'externa', 'ref.md'), 'referência\n');
  const git = (dir, ...args) => spawnSync('git', ['-C', dir, ...args], { encoding: 'utf8' });
  git(work, 'init', '-q', '-b', 'main'); git(work, 'add', '-A');
  git(work, '-c', 'user.name=t', '-c', 'user.email=t@t.example', 'commit', '-qm', 'x');
  spawnSync('git', ['clone', '-q', '--bare', work, join(base, 'origin.git')]);
  const url = `file://${join(base, 'origin.git').split('\\').join('/').replace(/^([A-Za-z]):/, '/$1:')}`;
  const none = run('import', url, '-s', 'nao-tem', '--yes');
  assert.equal(none.status, 1);
  assert.match(none.stderr, /não tem a\(s\) skill\(s\): nao-tem\. Disponíveis: externa/);
  const result = run('import', url, '-s', 'externa', '--yes');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /1 skill\(s\) trazidas para SKILLS\/: externa/);
  assert.match(result.stdout, /catalog assign -s externa -b <bundle>/);
  assert.equal(await readFile(join(catalog, 'SKILLS', 'externa', 'ref.md'), 'utf8'), 'referência\n');
  assert.ok(!existsSync(join(catalog, 'SKILLS', 'externa', '.git')));
  const again = run('import', url, '-s', 'externa', '--yes');
  assert.equal(again.status, 1);
  assert.match(again.stderr, /Erro: Já existe em SKILLS\/: externa\. Passe --force para substituir\./);
  assert.equal(run('import', url, '-s', 'externa', '--force', '--yes').status, 0);
  assert.equal(run('import', '--upload-pack=x', '-s', 'externa', '--yes').status, 1);
});

test('P12: model-invocation cria agents/openai.yaml só nas skills com a flag', async t => {
  const { run, catalog } = await setup(t);
  const dry = run('model-invocation', '--dry-run');
  assert.match(dry.stdout, /delta · seria criado: agents\/openai\.yaml/);
  assert.ok(!existsSync(join(catalog, 'SKILLS', 'delta', 'agents')));
  const result = run('model-invocation');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /delta · criado: agents\/openai\.yaml/);
  assert.equal(await readFile(join(catalog, 'SKILLS', 'delta', 'agents', 'openai.yaml'), 'utf8'), 'policy:\n  allow_implicit_invocation: false\n');
  assert.ok(!existsSync(join(catalog, 'SKILLS', 'alpha', 'agents')));
  assert.deepEqual(JSON.parse(run('model-invocation', '--json').stdout), [{ name: 'delta', status: 'exists' }]);
});
