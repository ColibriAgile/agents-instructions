import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

test('AC8: npm tarball contains resources and installs a real skill outside the clone', async t => {
  const root = await mkdtemp(join(tmpdir(), 'colibri package '));
  t.after(() => rm(root, { recursive: true, force: true }));
  assert.ok(process.env.npm_execpath, 'Run package verification through npm test');
  const npm = args => {
    const result = spawnSync(process.execPath, [process.env.npm_execpath, ...args], {
      cwd: resolve('.'), encoding: 'utf8', timeout: 60000,
      env: { ...process.env, npm_config_cache: join(root, 'empty npm cache') },
    });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    return result.stdout;
  };
  const [pack] = JSON.parse(npm(['pack', '--ignore-scripts', '--json', '--pack-destination', root]));
  const paths = pack.files.map(f => f.path);
  assert.ok(paths.includes('skill-requirements.yaml'));
  for (const expected of ['bin/colibri-skills.mjs', 'dist/cli.js', 'bundles.yaml', 'SKILLS/commit/SKILL.md', 'SKILLS/ai-ready-score/scripts/discover.py']) assert.ok(paths.includes(expected), expected);
  assert.equal(paths.some(p => p.startsWith('node_modules/') || p.startsWith('.specs/')), false);
  const consumer = join(root, 'consumer');
  const project = join(root, 'project');
  await mkdir(project);
  // Resolve consumer dependencies online; the installed CLI then uses only the local catalog.
  npm(['install', '--prefix', consumer, '--ignore-scripts', '--no-audit', '--no-fund', join(root, pack.filename)]);
  const entry = join(consumer, 'node_modules/@colibriagile/agents-instructions/bin/colibri-skills.mjs');
  const unsupported = spawnSync(process.execPath, ['--import', `data:text/javascript,${encodeURIComponent("Object.defineProperty(process.versions, 'node', { value: '20.19.6' });")}`, entry], { cwd: project, encoding: 'utf8' });
  assert.equal(unsupported.status, 1);
  assert.equal(unsupported.stdout, '');
  assert.match(unsupported.stderr, /requires Node\.js >=22\.20\.0; detected v20\.19\.6/);
  const env = { ...process.env, HOME: root, USERPROFILE: root, DISABLE_TELEMETRY: '1' };
  delete env.CLAUDE_CONFIG_DIR;
  delete env.CODEX_HOME;
  const run = args => {
    const result = spawnSync(process.execPath, [entry, ...args], { cwd: project, encoding: 'utf8', env, timeout: 30000 });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    return result.stdout;
  };
  assert.equal(JSON.parse(run(['list', '--available', '--json'])).length, 69);
  const delphi = JSON.parse(run(['list', '--available', '--json'])).find(s => s.name === 'delphi-xe2-build');
  assert.equal(delphi.runtime.summary, 'Requer Windows e Delphi XE2');
  assert.deepEqual(delphi.requirements.platforms, ['win32']);
  run(['install', '--skill', 'commit', '--agent', 'claude-code', '--yes']);
  assert.match(await readFile(join(project, '.claude/skills/commit/SKILL.md'), 'utf8'), /name: commit/);
});
