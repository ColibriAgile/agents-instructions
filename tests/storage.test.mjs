import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { loadState, saveState, withScopeLock } from '../dist/storage.js';
import { backend } from '../dist/backend.js';

test('AC7: state rejects corruption and mutation lock prevents concurrent writers', async t => {
  const cwd = await mkdtemp(join(tmpdir(), 'colibri storage '));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const scope = { cwd, global: false };
  const state = await loadState(scope);
  assert.deepEqual(state.skills, {});
  await saveState(scope, state);
  assert.equal(JSON.parse(await readFile(join(cwd, '.colibri-skills.json'), 'utf8')).version, 1);
  await withScopeLock(scope, async () => {
    await assert.rejects(() => withScopeLock(scope, async () => {}), /Another Colibri operation/);
  });
  await withScopeLock(scope, async () => {});
  for (const text of ['{broken', '{"version":2,"skills":{}}', '{"version":1,"skills":{"../bad":{}}}']) {
    await writeFile(join(cwd, '.colibri-skills.json'), text);
    await assert.rejects(() => loadState(scope), /Invalid Colibri state/);
    assert.equal(await readFile(join(cwd, '.colibri-skills.json'), 'utf8'), text);
  }
});

test('AC4: backend failures propagate without executing shell substitutions', async t => {
  const cwd = await mkdtemp(join(tmpdir(), 'colibri backend '));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  await assert.rejects(() => backend(['add', join(cwd, 'missing $(touch sentinel)'), '--skill', 'demo', '--agent', 'claude-code', '--yes', '--json'], { cwd, global: false }), /skills backend failed/);
  await assert.rejects(() => readFile(join(cwd, 'sentinel')), { code: 'ENOENT' });
});

const interruptions = ['SIGINT', 'SIGTERM', 'SIGHUP'];
const listeners = () => interruptions.map(signal => process.listenerCount(signal));

test('R2: no lock path leaves signal listeners behind', async t => {
  const cwd = await mkdtemp(join(tmpdir(), 'colibri listeners '));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const scope = { cwd, global: false };
  const before = listeners();
  await withScopeLock(scope, async () => {});
  await assert.rejects(() => withScopeLock(scope, async () => { throw new Error('action failed'); }), /action failed/);
  await writeFile(join(cwd, '.colibri-skills.json.lock'), 'pid=0\n');
  await assert.rejects(() => withScopeLock(scope, async () => {}), /Another Colibri operation/);
  assert.deepEqual(listeners(), before);
});

// The pending signal is dispatched while the lock is still being created, before the action can observe it.
test('R2: a signal that arrives while the lock is created releases it and exits with the signal code', { skip: process.platform === 'win32' }, async t => {
  const cwd = await mkdtemp(join(tmpdir(), 'colibri early signal '));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const storage = pathToFileURL(resolve('dist/storage.js')).href;
  const script = `
    import { withScopeLock } from ${JSON.stringify(storage)};
    process.on('SIGTERM', () => {});
    process.kill(process.pid, 'SIGTERM');
    try { await withScopeLock({ cwd: process.argv[1], global: false }, async () => { console.log('action ran'); }); }
    catch (error) { console.error(error.message); process.exitCode ||= 1; }
  `;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script, cwd], { encoding: 'utf8', timeout: 30000 });
  assert.equal(result.status, 143, `${result.stdout}\n${result.stderr}`);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /interrupted by SIGTERM/i);
  await assert.rejects(() => readFile(join(cwd, '.colibri-skills.json.lock')), { code: 'ENOENT' });
});

// The child signals itself inside the action, after which no checkpoint remains: only the outcome decides the exit code.
test('R2: a signal after the action finished exits 0 with a warning, and one before a failure keeps the signal code', { skip: process.platform === 'win32' }, async t => {
  const cwd = await mkdtemp(join(tmpdir(), 'colibri late signal '));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const storage = pathToFileURL(resolve('dist/storage.js')).href;
  const run = fail => spawnSync(process.execPath, ['--input-type=module', '-e', `
    import { withScopeLock } from ${JSON.stringify(storage)};
    try {
      await withScopeLock({ cwd: process.argv[1], global: false }, async interruption => {
        process.kill(process.pid, 'SIGTERM');
        await new Promise(resolve => { const poll = setInterval(() => { if (interruption.aborted) { clearInterval(poll); resolve(); } }, 1); });
        if (${fail}) throw interruption.reason;
        console.log('completed');
      });
    } catch (error) { console.error(error.message); process.exitCode ||= 1; }
  `, cwd], { encoding: 'utf8', timeout: 30000 });
  const completed = run(false);
  assert.equal(completed.status, 0, `${completed.stdout}\n${completed.stderr}`);
  assert.equal(completed.stdout, 'completed\n');
  assert.match(completed.stderr, /Received SIGTERM after all changes were applied; the operation completed\./);
  await assert.rejects(() => readFile(join(cwd, '.colibri-skills.json.lock')), { code: 'ENOENT' });
  const failed = run(true);
  assert.equal(failed.status, 143, `${failed.stdout}\n${failed.stderr}`);
  assert.match(failed.stderr, /interrupted by SIGTERM/i);
  assert.doesNotMatch(failed.stderr, /after all changes were applied/);
  await assert.rejects(() => readFile(join(cwd, '.colibri-skills.json.lock')), { code: 'ENOENT' });
});
