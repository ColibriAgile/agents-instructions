import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm, lstat, access, symlink, rename, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

const cli = resolve('bin/colibri-skills.mjs');

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'colibri lifecycle '));
  t.after(() => rm(root, { recursive: true, force: true }));
  const home = join(root, 'isolated home');
  const project = join(root, 'project with spaces');
  const catalog = join(root, 'local catalog');
  await mkdir(home, { recursive: true });
  await mkdir(project);
  for (const name of ['demo', 'essential']) {
    await mkdir(join(catalog, 'SKILLS', name), { recursive: true });
    await writeFile(join(catalog, 'SKILLS', name, 'SKILL.md'), `---\nname: ${name}\ndescription: Test ${name}\n---\nVersion one\n`);
  }
  await writeFile(join(catalog, 'bundles.yaml'), 'repo: test/catalog\nbundles:\n  core:\n    description: Mandatory\n    skills: [essential]\n  example:\n    description: Example\n    skills: [demo]\n');
  const env = { ...process.env, HOME: home, USERPROFILE: home, XDG_CONFIG_HOME: join(home, '.config'), NO_COLOR: '1', DISABLE_TELEMETRY: '1' };
  for (const key of ['CODEX_HOME', 'CLAUDE_CONFIG_DIR', 'SKILLS_CDN_REF', 'APPDATA']) delete env[key];
  function run(args, success = true) {
    const result = spawnSync(process.execPath, [cli, ...args, '--catalog', catalog, '--cwd', project], { env, encoding: 'utf8', timeout: 30000 });
    assert.equal(result.error, undefined);
    if (success) assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    else assert.notEqual(result.status, 0, `${result.stdout}\n${result.stderr}`);
    return result;
  }
  return { root, home, project, catalog, env, run };
}

test('AC4–6: copy lifecycle preserves another target, manual skills and local edits', async t => {
  const { project, catalog, run } = await fixture(t);
  await mkdir(join(project, '.claude/skills/manual'), { recursive: true });
  await writeFile(join(project, '.claude/skills/manual/SKILL.md'), 'User authored');
  run(['install', '-s', 'demo', '-a', 'claude-code', 'codex', '--yes']);
  const claude = join(project, '.claude/skills/demo/SKILL.md');
  const codex = join(project, '.agents/skills/demo/SKILL.md');
  assert.match(await readFile(claude, 'utf8'), /Version one/);
  assert.match(await readFile(codex, 'utf8'), /Version one/);
  assert.equal((await lstat(join(project, '.claude/skills/demo'))).isSymbolicLink(), false);
  assert.match(run(['install', '-s', 'demo', '-a', 'claude-code', 'codex', '--yes']).stdout, /unchanged/i);
  await writeFile(join(catalog, 'SKILLS/demo/SKILL.md'), '---\nname: demo\ndescription: Test demo\n---\nVersion two\n');
  run(['update', '-s', 'demo', '-a', 'claude-code', '--yes']);
  assert.match(await readFile(claude, 'utf8'), /Version two/);
  assert.match(await readFile(codex, 'utf8'), /Version one/);
  await writeFile(claude, 'Manual edit');
  assert.match(run(['update', '-s', 'demo', '-a', 'claude-code', '--yes'], false).stderr, /modified/i);
  assert.equal(await readFile(claude, 'utf8'), 'Manual edit');
  run(['remove', '-s', 'demo', '-a', 'claude-code', '--force', '--yes']);
  await assert.rejects(() => access(claude), { code: 'ENOENT' });
  assert.match(await readFile(codex, 'utf8'), /Version one/);
  assert.equal(await readFile(join(project, '.claude/skills/manual/SKILL.md'), 'utf8'), 'User authored');
  const metadata = JSON.parse(await readFile(join(project, '.colibri-skills.json'), 'utf8'));
  assert.deepEqual(Object.keys(metadata.skills.demo.targets), ['codex']);
});

test('AC4–5: symlinks survive partial removal; shared aliases cannot be removed independently', async t => {
  const { project, catalog, run } = await fixture(t);
  run(['install', '-s', 'demo', '-a', 'claude-code', 'codex', '--method', 'symlink', '--yes']);
  assert.equal((await lstat(join(project, '.claude/skills/demo'))).isSymbolicLink(), true);
  run(['remove', '-s', 'demo', '-a', 'claude-code', '--yes']);
  assert.match(await readFile(join(project, '.agents/skills/demo/SKILL.md'), 'utf8'), /Version one/);
  run(['install', '-s', 'demo', '-a', 'cursor', '--yes']);
  assert.match(run(['remove', '-s', 'demo', '-a', 'codex', '--yes'], false).stderr, /shared/i);
  await access(join(project, '.agents/skills/demo/SKILL.md'));
  await writeFile(join(catalog, 'SKILLS/demo/resource.txt'), 'Bundled resource');
  run(['update', '-s', 'demo', '--yes']);
  assert.equal(await readFile(join(project, '.agents/skills/demo/resource.txt'), 'utf8'), 'Bundled resource');
  run(['remove', '-s', 'demo', '--yes']);
  await assert.rejects(() => access(join(project, '.agents/skills/demo')), { code: 'ENOENT' });
});

test('AC6: unmanaged collisions, dry runs, unknown names and manual removals cause no writes', async t => {
  const { project, run } = await fixture(t);
  await mkdir(join(project, '.claude/skills/demo'), { recursive: true });
  const path = join(project, '.claude/skills/demo/SKILL.md');
  await writeFile(path, 'Manual content');
  assert.match(run(['install', '-s', 'demo', '-a', 'claude-code', '--yes'], false).stderr, /unmanaged/i);
  assert.equal(await readFile(path, 'utf8'), 'Manual content');
  run(['install', '-s', 'demo', '-a', 'claude-code', '--dry-run']);
  await assert.rejects(() => access(join(project, '.colibri-skills.json')), { code: 'ENOENT' });
  run(['install', '-s', '../escape', '-a', 'claude-code', '--yes'], false);
  run(['remove', '-s', 'demo', '--yes'], false);
  assert.equal(await readFile(path, 'utf8'), 'Manual content');
  run(['install', '-s', 'demo', '-a', 'claude-code', '--force', '--yes']);
  assert.match(await readFile(path, 'utf8'), /Version one/);
});

test('AC2,6: manifest installation adds core, preserves sources and reconciles only managed extras', async t => {
  const { project, run } = await fixture(t);
  await writeFile(join(project, 'skills.yaml'), '# existing\nbundles: [example]\nteam: keep\n');
  run(['install', '-a', 'claude-code', '--yes']);
  await access(join(project, '.claude/skills/essential/SKILL.md'));
  await access(join(project, '.claude/skills/demo/SKILL.md'));
  await mkdir(join(project, '.claude/skills/manual'), { recursive: true });
  await writeFile(join(project, '.claude/skills/manual/SKILL.md'), 'Unrelated');
  await writeFile(join(project, 'skills.yaml'), 'bundles: [core]\nteam: keep\n');
  const result = run(['reconcile', '--json']);
  assert.deepEqual(JSON.parse(result.stdout).map(s => s.name), ['demo']);
  run(['reconcile', '-s', 'demo', '--yes']);
  await assert.rejects(() => access(join(project, '.claude/skills/demo')), { code: 'ENOENT' });
  assert.equal(await readFile(join(project, '.claude/skills/manual/SKILL.md'), 'utf8'), 'Unrelated');
  assert.match(await readFile(join(project, 'skills.yaml'), 'utf8'), /team: keep/);
});

test('AC7: global operations use isolated home and never write project manifests or metadata', async t => {
  const { project, home, run } = await fixture(t);
  run(['install', '-s', 'demo', '-a', 'claude-code', '--global', '--yes']);
  assert.match(await readFile(join(home, '.claude/skills/demo/SKILL.md'), 'utf8'), /Version one/);
  await access(join(home, '.colibri-agents/skills.json'));
  for (const name of ['skills.yaml', '.colibri-skills.json', 'skills-lock.json']) await assert.rejects(() => access(join(project, name)), { code: 'ENOENT' });
  run(['remove', '-s', 'demo', '--global', '--yes']);
  await assert.rejects(() => access(join(home, '.claude/skills/demo')), { code: 'ENOENT' });
});

test('AC4: failed external source is not recorded as installed', async t => {
  const { project, root, run } = await fixture(t);
  await writeFile(join(project, 'skills.yaml'), `sources:\n  - repo: ${JSON.stringify(join(root, 'missing source'))}\n    skills: [absent]\n`);
  run(['install', '-a', 'claude-code', '--yes'], false);
  let state;
  try { state = JSON.parse(await readFile(join(project, '.colibri-skills.json'), 'utf8')); }
  catch (error) { assert.equal(error.code, 'ENOENT'); }
  assert.equal(state?.skills.absent, undefined);
});

test('AC5: updating linked targets keeps the chosen method and partial removal leaves the other link working', async t => {
  const { project, catalog, run } = await fixture(t);
  run(['install', '-s', 'demo', '-a', 'claude-code', 'codex', '--method', 'symlink', '--yes']);
  await writeFile(join(catalog, 'SKILLS/demo/extra.txt'), 'New resource');
  run(['update', '-s', 'demo', '--yes']);
  assert.equal((await lstat(join(project, '.claude/skills/demo'))).isSymbolicLink(), true);
  assert.equal(await readFile(join(project, '.claude/skills/demo/extra.txt'), 'utf8'), 'New resource');
  run(['install', '-s', 'essential', '-a', 'claude-code', 'windsurf', '--method', 'symlink', '--yes']);
  run(['remove', '-s', 'essential', '-a', 'claude-code', '--yes']);
  assert.match(await readFile(join(project, '.windsurf/skills/essential/SKILL.md'), 'utf8'), /Version one/);
});

test('AC4,6: local bundle selection saves core without losing external source fields', async t => {
  const { project, catalog, run } = await fixture(t);
  await writeFile(join(project, 'skills.yaml'), `# preserve\nsources:\n  - repo: ${JSON.stringify(join(catalog, 'SKILLS'))}\n    skills: [essential]\n    note: retained\nteam: keep\n`);
  run(['install', '-b', 'example', '-a', 'claude-code', '--yes'], false);
  // The same skill from two different source intents must be rejected before writes.
  await assert.rejects(() => access(join(project, '.claude')), { code: 'ENOENT' });
});

test('AC2,4: saving bundle selection installs external skills and retains source metadata', async t => {
  const { project, root, run } = await fixture(t);
  const external = join(root, 'external source');
  await mkdir(join(external, 'outside'), { recursive: true });
  await writeFile(join(external, 'outside/SKILL.md'), '---\nname: outside\ndescription: External skill\n---\nExternal content\n');
  await writeFile(join(project, 'skills.yaml'), `# keep comment\nsources:\n  - repo: ${JSON.stringify(external)}\n    skills: [outside]\n    note: retained\nteam: keep\n`);
  run(['install', '-b', 'example', '-a', 'claude-code', '--yes']);
  const manifest = await readFile(join(project, 'skills.yaml'), 'utf8');
  assert.match(manifest, /- core/);
  assert.match(manifest, /- example/);
  assert.match(manifest, /keep comment/);
  assert.match(manifest, /note: retained/);
  assert.match(manifest, /team: keep/);
  assert.match(await readFile(join(project, '.claude/skills/outside/SKILL.md'), 'utf8'), /External content/);
});

test('AC7: global Claude config override is honored', async t => {
  const { project, catalog, root, env } = await fixture(t);
  const config = join(root, 'custom Claude config');
  const result = spawnSync(process.execPath, [cli, 'install', '-s', 'demo', '-a', 'claude-code', '--global', '--yes', '--catalog', catalog, '--cwd', project], {
    env: { ...env, CLAUDE_CONFIG_DIR: config }, encoding: 'utf8', timeout: 30000,
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(await readFile(join(config, 'skills/demo/SKILL.md'), 'utf8'), /Version one/);
  await assert.rejects(() => access(join(project, '.claude')), { code: 'ENOENT' });
});

test('AC7: a relative global Claude config resolves against the selected working directory', async t => {
  const { root, home, project, catalog, env } = await fixture(t);
  const result = spawnSync(process.execPath, [cli, 'install', '-s', 'demo', '-a', 'claude-code', '--global', '--yes', '--catalog', catalog, '--cwd', project], {
    cwd: root, env: { ...env, CLAUDE_CONFIG_DIR: 'relative-config' }, encoding: 'utf8', timeout: 30000,
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(await readFile(join(project, 'relative-config/skills/demo/SKILL.md'), 'utf8'), /Version one/);
  assert.ok(result.stdout.includes(join(project, 'relative-config/skills/demo')));
  assert.equal(JSON.parse(await readFile(join(home, '.colibri-agents/skills.json'), 'utf8')).skills.demo.targets['claude-code'].method, 'copy');
  await assert.rejects(() => access(join(root, 'relative-config')), { code: 'ENOENT' });
});

test('AC5–6: retained canonical ownership permits reinstall and still protects edits and unregistered consumers', async t => {
  const { project, catalog, run } = await fixture(t);
  const canonical = join(project, '.agents/skills/demo');
  run(['install', '-s', 'demo', '-a', 'claude-code', 'windsurf', '--method', 'symlink', '--yes']);
  const unregistered = join(project, '.another-agent/skills/demo');
  await mkdir(join(project, '.another-agent/skills'), { recursive: true });
  await symlink(canonical, unregistered, process.platform === 'win32' ? 'junction' : 'dir');
  run(['remove', '-s', 'demo', '--yes']);
  assert.match(await readFile(join(unregistered, 'SKILL.md'), 'utf8'), /Version one/);
  assert.deepEqual(JSON.parse(run(['list', '--json']).stdout), []);
  run(['install', '-s', 'demo', '-a', 'claude-code', 'windsurf', '--method', 'symlink', '--yes']);
  assert.equal((await lstat(join(project, '.claude/skills/demo'))).isSymbolicLink(), true);
  run(['remove', '-s', 'demo', '--yes']);
  await writeFile(join(canonical, 'SKILL.md'), 'Manual canonical edit');
  assert.match(run(['install', '-s', 'demo', '-a', 'codex', '--method', 'copy', '--yes'], false).stderr, /modified/i);
  assert.equal(await readFile(join(unregistered, 'SKILL.md'), 'utf8'), 'Manual canonical edit');
  await writeFile(join(canonical, 'SKILL.md'), await readFile(join(catalog, 'SKILLS/demo/SKILL.md')));
  run(['install', '-s', 'demo', '-a', 'codex', '--method', 'copy', '--yes']);
  assert.match(await readFile(join(canonical, 'SKILL.md'), 'utf8'), /Version one/);
});

test('AC5: external source updates use the recorded source and keep the installation method', async t => {
  const { root, project, run } = await fixture(t);
  const external = join(root, 'external versioned');
  await mkdir(join(external, 'outside'), { recursive: true });
  const skill = join(external, 'outside/SKILL.md');
  await writeFile(skill, '---\nname: outside\ndescription: External source\n---\nExternal version one\n');
  await writeFile(join(project, 'skills.yaml'), `sources:\n  - repo: ${JSON.stringify(external)}\n    skills: [outside]\n`);
  run(['install', '-a', 'claude-code', 'windsurf', '--method', 'symlink', '--yes']);
  await writeFile(skill, '---\nname: outside\ndescription: External source\n---\nExternal version two\n');
  run(['update', '-s', 'outside', '--yes']);
  assert.match(await readFile(join(project, '.claude/skills/outside/SKILL.md'), 'utf8'), /External version two/);
  assert.match(await readFile(join(project, '.windsurf/skills/outside/SKILL.md'), 'utf8'), /External version two/);
  assert.equal((await lstat(join(project, '.claude/skills/outside'))).isSymbolicLink(), true);
  const state = JSON.parse(await readFile(join(project, '.colibri-skills.json'), 'utf8'));
  assert.equal(state.skills.outside.source, external);
  assert.equal(state.skills.outside.origin, 'external');
  assert.equal(state.skills.outside.targets['claude-code'].method, 'symlink');
});


test('R1: force install refuses a source alias of the destination without deleting its files', async t => {
  const { project, catalog, run } = await fixture(t);
  const destination = join(project, '.claude/skills');
  await mkdir(join(project, '.claude'));
  await rename(join(catalog, 'SKILLS'), destination);
  await symlink(destination, join(catalog, 'SKILLS'), process.platform === 'win32' ? 'junction' : 'dir');
  const original = await readFile(join(destination, 'demo/SKILL.md'), 'utf8');
  const result = run(['install', '-s', 'demo', '-a', 'claude-code', '--force', '--yes'], false);
  assert.match(result.stderr, /overlaps source/i);
  assert.equal(await readFile(join(destination, 'demo/SKILL.md'), 'utf8'), original);
  assert.deepEqual(JSON.parse(run(['list', '--json']).stdout), []);
});


test('R3: copy failure reports its real cause when the backend also writes presentation logs', { skip: process.platform === 'win32' || process.getuid?.() === 0 }, async t => {
  const { project, run } = await fixture(t);
  const blocked = join(project, '.windsurf/skills');
  await mkdir(blocked, { recursive: true });
  await chmod(blocked, 0o555);
  try {
    const result = run(['install', '-s', 'demo', '-a', 'windsurf', '--yes'], false);
    assert.match(result.stderr, /EACCES|permission denied/i);
  } finally { await chmod(blocked, 0o755); }
});

test('R2: failed second target rolls back a fresh installation and can be retried without force', { skip: process.platform === 'win32' || process.getuid?.() === 0 }, async t => {
  const { project, run } = await fixture(t);
  const blocked = join(project, '.windsurf/skills');
  await mkdir(blocked, { recursive: true });
  await chmod(blocked, 0o555);
  try {
    run(['install', '-s', 'demo', '-a', 'claude-code', 'windsurf', '--yes'], false);
    assert.deepEqual(JSON.parse(run(['list', '--json']).stdout), []);
    await assert.rejects(() => access(join(project, '.claude/skills/demo')), { code: 'ENOENT' });
  } finally { await chmod(blocked, 0o755); }
  run(['install', '-s', 'demo', '-a', 'claude-code', 'windsurf', '--yes']);
  const rows = JSON.parse(run(['list', '--json']).stdout);
  assert.deepEqual(rows[0].targets.map(t => t.status), ['installed', 'installed']);
});

test('R2: a failed update restores existing copies and canonical symlinks before retry', { skip: process.platform === 'win32' }, async t => {
  for (const method of ['copy', 'symlink']) {
    const { project, catalog, run } = await fixture(t);
    run(['install', '-s', 'demo', '-a', 'claude-code', 'windsurf', '--method', method, '--yes']);
    await writeFile(join(catalog, 'SKILLS/demo/SKILL.md'), '---\nname: demo\ndescription: Demo\n---\nVersion two\n');
    const fifo = join(catalog, 'SKILLS/demo/unsupported-fifo');
    const created = spawnSync('mkfifo', [fifo], { encoding: 'utf8' });
    assert.equal(created.status, 0, created.stderr);
    run(['update', '-s', 'demo', '--yes'], false);
    for (const agent of ['.claude', '.windsurf']) {
      assert.match(await readFile(join(project, agent, 'skills/demo/SKILL.md'), 'utf8'), /Version one/);
      assert.equal((await lstat(join(project, agent, 'skills/demo'))).isSymbolicLink(), method === 'symlink');
    }
    assert.deepEqual(JSON.parse(run(['list', '--json']).stdout)[0].targets.map(t => t.status), ['installed', 'installed']);
    await rm(fifo);
    run(['update', '-s', 'demo', '--yes']);
    for (const agent of ['.claude', '.windsurf']) assert.match(await readFile(join(project, agent, 'skills/demo/SKILL.md'), 'utf8'), /Version two/);
  }
});

async function largeSkill(catalog) {
  const files = 5000;
  for (let start = 0; start < files; start += 1000) {
    await Promise.all(Array.from({ length: 1000 }, (_, i) => writeFile(join(catalog, 'SKILLS/demo', `file-${start + i}.txt`), `${start + i}\n`)));
  }
  return files + 1;
}

const entries = path => readdir(path).then(names => names.length, () => 0);

// Signals the CLI while the backend is filling the destination, or once ready() holds; group mimics Ctrl+C in a terminal.
async function interrupt({ project, catalog, env }, args, signal, total, group = false, ready = async () => {
  const count = await entries(join(project, '.claude/skills/demo'));
  return count > 0 && count < total;
}) {
  const child = spawn(process.execPath, [cli, ...args, '--catalog', catalog, '--cwd', project], { env, detached: group, stdio: ['ignore', 'pipe', 'pipe'] });
  let stderr = '';
  child.stderr.setEncoding('utf8').on('data', chunk => { stderr += chunk; });
  const closed = new Promise(resolve => child.on('close', code => resolve(code)));
  for (;;) {
    if (await ready()) break;
    if (child.exitCode !== null) assert.fail(`CLI finished before the interruption: ${stderr}`);
    await new Promise(resolve => setTimeout(resolve, 5));
  }
  if (group) process.kill(-child.pid, signal);
  else child.kill(signal);
  return { code: await closed, stderr };
}

test('R2: a signal during copy rolls back, releases the lock and allows retry without force', { skip: process.platform === 'win32' }, async t => {
  const context = await fixture(t);
  const { root, project, catalog, env, run } = context;
  const temporary = join(root, 'temporary');
  await mkdir(temporary);
  env.TMPDIR = temporary;
  const total = await largeSkill(catalog);
  const destination = join(project, '.claude/skills/demo');
  const install = ['install', '-s', 'demo', '-a', 'claude-code', '--method', 'copy', '--yes'];
  const settled = async () => {
    await assert.rejects(() => access(join(project, '.colibri-skills.json.lock')), { code: 'ENOENT' });
    assert.deepEqual((await readdir(temporary)).filter(name => name.startsWith('colibri-rollback-')), []);
  };
  for (const [signal, code, group] of [['SIGTERM', 143, false], ['SIGINT', 130, true], ['SIGHUP', 129, false]]) {
    const result = await interrupt(context, install, signal, total, group);
    assert.equal(result.code, code, result.stderr);
    assert.match(result.stderr, new RegExp(`interrupted by ${signal}`, 'i'));
    await settled();
    await assert.rejects(() => access(destination), { code: 'ENOENT' });
    assert.deepEqual(JSON.parse(run(['list', '--json']).stdout), []);
  }
  run(install);
  const state = await readFile(join(project, '.colibri-skills.json'), 'utf8');
  await writeFile(join(catalog, 'SKILLS/demo/SKILL.md'), '---\nname: demo\ndescription: Test demo\n---\nVersion two\n');
  const update = await interrupt(context, ['update', '-s', 'demo', '--yes'], 'SIGINT', total);
  assert.equal(update.code, 130, update.stderr);
  await settled();
  assert.equal(await readFile(join(project, '.colibri-skills.json'), 'utf8'), state);
  // Recorded hashes cover names and bytes, so "installed" proves the previous copy came back intact.
  assert.deepEqual(JSON.parse(run(['list', '--json']).stdout)[0].targets.map(t => t.status), ['installed']);
  assert.match(await readFile(join(destination, 'SKILL.md'), 'utf8'), /Version one/);
  run(['update', '-s', 'demo', '--yes']);
  assert.match(await readFile(join(destination, 'SKILL.md'), 'utf8'), /Version two/);
});

test('E1: changing source for one target is refused and other targets keep their original source', async t => {
  const { root, project, run } = await fixture(t);
  run(['install', '-s', 'demo', '-a', 'claude-code', 'windsurf', '--yes']);
  const external = join(root, 'external demo');
  await mkdir(join(external, 'demo'), { recursive: true });
  await writeFile(join(external, 'demo/SKILL.md'), '---\nname: demo\ndescription: External demo\n---\nExternal content\n');
  const manifest = join(project, 'external.yaml');
  await writeFile(manifest, `sources:\n  - repo: ${JSON.stringify(external)}\n    skills: [demo]\n`);
  const result = run(['install', '--manifest', manifest, '-a', 'claude-code', '--force', '--yes'], false);
  assert.match(result.stderr, /source.*all|all.*source/i);
  run(['update', '-s', 'demo', '-a', 'windsurf', '--yes']);
  assert.match(await readFile(join(project, '.windsurf/skills/demo/SKILL.md'), 'utf8'), /Version one/);
  assert.equal(JSON.parse(run(['list', '--json']).stdout)[0].origin, 'catalog');
  run(['install', '--manifest', manifest, '-a', 'claude-code', 'windsurf', '--force', '--yes']);
  for (const agent of ['.claude', '.windsurf']) assert.match(await readFile(join(project, agent, 'skills/demo/SKILL.md'), 'utf8'), /External content/);
  assert.equal(JSON.parse(run(['list', '--json']).stdout)[0].origin, 'external');
});

test('R2: an interrupted remove releases the lock, leaves targets installed or missing and finishes on retry without force', { skip: process.platform === 'win32' }, async t => {
  const context = await fixture(t);
  const { project, catalog, run } = context;
  const total = await largeSkill(catalog);
  const [first, second] = ['.claude', '.windsurf'].map(agent => join(project, agent, 'skills/demo'));
  run(['install', '-s', 'demo', '-a', 'claude-code', 'windsurf', '--method', 'copy', '--yes']);
  // Targets are deleted one after another; signal while the first is going away or right after it is gone.
  const removing = async () => {
    const count = await entries(first);
    return (count > 0 && count < total) || (count === 0 && await entries(second) > 0);
  };
  const result = await interrupt(context, ['remove', '-s', 'demo', '--yes'], 'SIGTERM', total, false, removing);
  assert.equal(result.code, 143, result.stderr);
  assert.match(result.stderr, /interrupted by SIGTERM/i);
  await assert.rejects(() => access(join(project, '.colibri-skills.json.lock')), { code: 'ENOENT' });
  const rows = JSON.parse(run(['list', '--json']).stdout);
  assert.deepEqual(rows.map(row => row.name), ['demo']);
  for (const target of rows[0].targets) assert.ok(['installed', 'missing'].includes(target.status), JSON.stringify(rows[0].targets));
  run(['remove', '-s', 'demo', '--yes']);
  assert.deepEqual(JSON.parse(run(['list', '--json']).stdout), []);
  for (const destination of [first, second]) await assert.rejects(() => access(destination), { code: 'ENOENT' });
});
