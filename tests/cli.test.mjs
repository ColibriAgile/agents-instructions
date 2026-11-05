import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const entry = resolve('bin/colibri-skills.mjs');
const { version: packageVersion } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
test('AC1: help/version work outside the clone and non-TTY wizard explains command usage', async t => {
  const cwd = await mkdtemp(join(tmpdir(), 'colibri CLI '));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const run = args => spawnSync(process.execPath, [entry, ...args], { cwd, encoding: 'utf8' });
  const help = run(['--help']);
  assert.equal(help.status, 0);
  for (const command of ['install', 'update', 'remove', 'reconcile', 'list']) assert.match(help.stdout, new RegExp(command));
  const version = run(['--version']);
  assert.equal(version.status, 0);
  assert.equal(version.stdout.trim(), packageVersion);
  const wizard = run([]);
  assert.equal(wizard.status, 1);
  assert.match(wizard.stderr, /exige um terminal/);
  const unknown = run(['install', '--unknown']);
  assert.equal(unknown.status, 1);
  assert.match(unknown.stderr, /Erro: opção desconhecida '--unknown'/);
  assert.deepEqual(await readdir(cwd), []);
});

test('CR-UX: commander help and usage errors are in pt-BR with unchanged exit codes', async t => {
  const cwd = await mkdtemp(join(tmpdir(), 'colibri CLI pt-BR '));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const run = args => spawnSync(process.execPath, [entry, ...args], { cwd, encoding: 'utf8' });
  const english = /Usage:|Options:|Commands:|Arguments:|display help for command|output the version number|Did you mean|error:/;
  for (const args of [['--help'], ['install', '--help'], ['help', 'remove']]) {
    const help = run(args);
    assert.equal(help.status, 0, args.join(' '));
    assert.doesNotMatch(help.stdout, english, args.join(' '));
    assert.match(help.stdout, /Uso:/, args.join(' '));
    assert.match(help.stdout, /Opções:/, args.join(' '));
  }
  assert.match(run(['--help']).stdout, /Comandos:[\s\S]*Exibe a ajuda de um comando/);
  assert.match(run(['install', '--help']).stdout, /-h, --help\s+Exibe a ajuda do comando/);
  assert.match(run(['--help']).stdout, /-V, --version\s+Exibe o número da versão/);
  assert.equal(run(['--version']).stdout.trim(), packageVersion);
  const missing = run(['install', '--method']);
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /Erro: falta o valor da opção '--method <method>'/);
  // The root has its own action (the wizard), so commander reports a mistyped command as an excess argument.
  const command = run(['instal']);
  assert.equal(command.status, 1);
  assert.match(command.stderr, /Erro: argumentos demais\. Esperados 0, recebidos 1: instal\./);
  const typo = run(['install', '--dry-rn']);
  assert.equal(typo.status, 1);
  assert.match(typo.stderr, /Erro: opção desconhecida '--dry-rn'\n\(Você quis dizer --dry-run\?\)/);
  const extra = run(['list', 'extra']);
  assert.equal(extra.status, 1);
  assert.match(extra.stderr, /Erro: argumentos demais para 'list'\. Esperados 0, recebidos 1: extra\./);
  // Every rule in the translation table is exercised above; commander is pinned, so a changed message fails here.
  for (const result of [missing, command, typo, extra]) assert.doesNotMatch(result.stderr, english);
  assert.deepEqual(await readdir(cwd), []);
});

test('AC1,4: JSON catalog and noninteractive confirmation checks create no installation', async t => {
  const cwd = await mkdtemp(join(tmpdir(), 'colibri CLI preview '));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const run = args => spawnSync(process.execPath, [entry, ...args], { cwd, encoding: 'utf8' });
  const list = run(['list', '--available', '--json']);
  assert.equal(list.status, 0);
  assert.equal(JSON.parse(list.stdout).length, 69);
  const preview = run(['install', '--skill', 'commit', '--agent', 'claude-code', '--dry-run', '--json']);
  assert.equal(preview.status, 0);
  const plan = JSON.parse(preview.stdout);
  assert.equal(plan.action, 'install');
  assert.deepEqual(plan.items.map(s => s.name), ['commit']);
  assert.deepEqual(plan.items[0].targets, [{ agent: 'claude-code', method: 'copy' }]);
  const confirm = run(['install', '--skill', 'commit', '--agent', 'claude-code']);
  assert.equal(confirm.status, 1);
  assert.match(confirm.stderr, /passe --yes/);
  assert.deepEqual(await readdir(cwd), []);
});

test('CR-07: comma separated lists accept spaces after the comma', async () => {
  const { values } = await import('../dist/commands.js');
  assert.deepEqual(values(['deep-review, kb', ' codex ,, cursor']), ['deep-review', 'kb', 'codex', 'cursor']);
});
