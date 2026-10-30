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
  assert.match(wizard.stderr, /requires a terminal/);
  const unknown = run(['install', '--unknown']);
  assert.equal(unknown.status, 1);
  assert.match(unknown.stderr, /unknown option/);
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
  assert.match(confirm.stderr, /pass --yes/);
  assert.deepEqual(await readdir(cwd), []);
});
