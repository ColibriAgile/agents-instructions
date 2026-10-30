import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readdir, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const entry = resolve('bin/colibri-skills.mjs');
const { version: packageVersion } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const versionOverride = version => `data:text/javascript,${encodeURIComponent(`Object.defineProperty(process.versions, 'node', { value: ${JSON.stringify(version)} });`)}`;

test('unsupported Node is rejected before the wizard, commands or dependencies load', async t => {
  const cwd = await mkdtemp(join(tmpdir(), 'colibri runtime '));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  for (const version of ['20.19.6', '22.19.0', '22.20.0-rc.1']) {
    for (const args of [[], ['install', '--global', '--skill', 'commit', '--agent', 'codex', '--yes'], ['update', '--yes'], ['remove', '--yes']]) {
      const result = spawnSync(process.execPath, ['--import', versionOverride(version), entry, ...args],
        { cwd, encoding: 'utf8', env: { ...process.env, HOME: cwd, USERPROFILE: cwd } });
      assert.equal(result.status, 1);
      assert.match(result.stderr, /requires Node\.js >=22\.20\.0/);
      assert.ok(result.stderr.includes(`detected v${version}`));
      assert.match(result.stderr, /Upgrade Node\.js/);
      assert.equal(result.stdout, '');
      assert.doesNotMatch(result.stderr, /SyntaxError|skills backend failed|requires a terminal/);
    }
  }
  assert.deepEqual(await readdir(cwd), []);
});

test('minimum supported Node and newer versions reach the CLI', () => {
  for (const version of ['22.20.0', '22.21.0', '24.0.0']) {
    const result = spawnSync(process.execPath, ['--import', versionOverride(version), entry, '--version'], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), packageVersion);
  }
});
