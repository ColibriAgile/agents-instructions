import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadCatalog, resolveSelection } from '../dist/catalog.js';
import { requirementInfo, bundleRequirementHint } from '../dist/requirements.js';
import { installPlan, managedPlan, preview } from '../dist/manager.js';
import { readManifest } from '../dist/manifest.js';
import { saveState } from '../dist/storage.js';
import { installedRows } from '../dist/commands.js';

test('R1/R2: curated requirements and host statuses are descriptive, not tool detection', async () => {
  const catalog = await loadCatalog();
  const delphi = catalog.skills.find(s => s.name === 'delphi-xe2-build');
  assert.deepEqual(delphi.requirements.platforms, ['win32']);
  assert.equal(requirementInfo(delphi.requirements, 'darwin').summary, 'Requer Windows e Delphi XE2');
  assert.equal(requirementInfo(delphi.requirements, 'linux').platformStatus, 'mismatch');
  const windows = requirementInfo(delphi.requirements, 'win32');
  assert.equal(windows.platformStatus, 'listed');
  assert.match(windows.notice, /ferramentas não verificadas/i);
  assert.match(requirementInfo(delphi.requirements, 'darwin').notice, /macOS/);
  assert.equal(requirementInfo(catalog.skills.find(s => s.name === 'assign-bundles').requirements).summary, 'Requer PowerShell 7');
  const unknown = requirementInfo(catalog.skills.find(s => s.name === 'commit').requirements);
  assert.equal(unknown.platformStatus, 'unknown');
  assert.equal(unknown.summary, 'Requisitos não catalogados');
  assert.match(unknown.notice, /não implica compatibilidade/i);
});

test('R3: explicit, bundle and manifest previews carry requirements and bundle restrictions', async t => {
  const catalog = await loadCatalog();
  const scope = { cwd: '/project', global: false };
  for (const selection of [resolveSelection(catalog, { skills: ['delphi-xe2-build'] }), resolveSelection(catalog, { bundles: ['delphi'] })]) {
    const plan = installPlan(scope, selection, ['claude-code'], 'copy');
    assert.match(preview(plan), /Requer Windows e Delphi XE2/);
    assert.equal(plan.items.find(s => s.name === 'delphi-xe2-build').requirements.platforms[0], 'win32');
    assert.ok(plan.items.find(s => s.name === 'delphi-xe2-build').runtime.notice);
  }
  const dir = await mkdtemp(join(tmpdir(), 'colibri requirements '));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await writeFile(join(dir, 'skills.yaml'), 'bundles: [delphi]\n');
  const selected = resolveSelection(catalog, { manifest: await readManifest(join(dir, 'skills.yaml')) });
  assert.match(preview(installPlan(scope, selected, ['claude-code'], 'copy')), /Requer Windows e Delphi XE2/);
  assert.match(bundleRequirementHint(catalog, 'delphi', 'darwin'), /Windows/);
  assert.match(bundleRequirementHint(catalog, 'delphi', 'darwin'), /restrição/);
});

test('R1: optional metadata is backward compatible; malformed or unknown requirements fail', async t => {
  const root = await mkdtemp(join(tmpdir(), 'colibri schema '));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'SKILLS/demo'), { recursive: true });
  await writeFile(join(root, 'SKILLS/demo/SKILL.md'), '---\nname: demo\ndescription: Demo\n---\n');
  await writeFile(join(root, 'bundles.yaml'), 'repo: test/repo\nbundles:\n  core:\n    description: Core\n    skills: [demo]\n');
  assert.equal((await loadCatalog(root)).skills[0].requirements, null);
  const path = join(root, 'skill-requirements.yaml');
  for (const text of [
    'version: 1\nskills: [',
    'version: 2\nskills: {}',
    'version: 1\nskills:\n  missing:\n    tools: [PowerShell]',
    'version: 1\nskills:\n  demo:\n    platforms: [windows]',
    'version: 1\nskills:\n  demo:\n    tools: PowerShell',
    'version: 1\nskills:\n  demo:\n    tools: [""]',
    'version: 1\nskills:\n  demo:\n    toolz: [PowerShell]',
    'version: 1\nskills:\n  demo: {}',
  ]) {
    await writeFile(path, text);
    await assert.rejects(() => loadCatalog(root), /requirement/i);
    assert.equal(await readFile(path, 'utf8'), text);
  }
});

test('R4: managed update uses current catalog requirements; external same-name skills remain unknown', async t => {
  const cwd = await mkdtemp(join(tmpdir(), 'colibri managed requirements '));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const scope = { cwd, global: false };
  const catalog = await loadCatalog();
  const skill = { source: catalog.source, origin: 'catalog', targets: { 'claude-code': { method: 'copy', hash: 'a'.repeat(64) } } };
  await saveState(scope, { version: 1, skills: { 'delphi-xe2-build': skill } });
  const updated = await managedPlan('update', scope, catalog);
  assert.equal(updated.items[0].runtime.summary, 'Requer Windows e Delphi XE2');
  await saveState(scope, { version: 1, skills: { 'delphi-xe2-build': { ...skill, origin: 'external', source: 'other/repo' } } });
  const external = await managedPlan('update', scope, catalog);
  assert.equal(external.items[0].requirements, null);
  assert.equal(external.items[0].runtime.summary, 'Requisitos não catalogados');
  const installed = await installedRows(scope, undefined, catalog);
  assert.equal(installed[0].requirements, null);
  assert.equal(installed[0].runtime.platformStatus, 'unknown');
});

test('R1/R4: tool-only and multi-platform declarations distinguish unspecified from listed systems', () => {
  const shell = requirementInfo({ tools: ['PowerShell 7'] }, 'linux');
  assert.equal(shell.platformStatus, 'unspecified');
  assert.equal(shell.summary, 'Requer PowerShell 7');
  assert.equal(shell.notice, 'Plataformas não catalogadas; ferramentas não verificadas.');
  for (const platform of ['darwin', 'linux']) {
    const info = requirementInfo({ platforms: ['darwin', 'linux'], tools: ['Python 3'] }, platform);
    assert.equal(info.platformStatus, 'listed');
    assert.equal(info.summary, 'Requer macOS ou Linux e Python 3');
  }
});

test('R3/R4: JSON exposes requirements; restricted skills remain installable without tools', async t => {
  const root = await mkdtemp(join(tmpdir(), 'colibri requirement install '));
  t.after(() => rm(root, { recursive: true, force: true }));
  const catalog = join(root, 'catalog');
  const project = join(root, 'project');
  await mkdir(project);
  await mkdir(join(catalog, 'SKILLS/demo'), { recursive: true });
  await writeFile(join(catalog, 'SKILLS/demo/SKILL.md'), '---\nname: demo\ndescription: Demo\n---\nNo tools executed\n');
  await writeFile(join(catalog, 'bundles.yaml'), 'repo: test/repo\nbundles:\n  core:\n    description: Core\n    skills: [demo]\n');
  const platform = process.platform === 'win32' ? 'linux' : 'win32';
  await writeFile(join(catalog, 'skill-requirements.yaml'), `version: 1\nskills:\n  demo:\n    platforms: [${platform}]\n    tools: [NonexistentTool123]\n    notes: [Declared requirement only]\n`);
  const run = args => {
    const result = spawnSync(process.execPath, [resolve('bin/colibri-skills.mjs'), ...args, '--cwd', project, '--catalog', catalog], { encoding: 'utf8', timeout: 30000, env: { ...process.env, HOME: root, USERPROFILE: root } });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    return result.stdout;
  };
  const plan = JSON.parse(run(['install', '-s', 'demo', '-a', 'claude-code', '--dry-run', '--json']));
  assert.equal(plan.items[0].runtime.platformStatus, 'mismatch');
  assert.deepEqual(plan.items[0].requirements.tools, ['NonexistentTool123']);
  await assert.rejects(() => access(join(project, '.claude')), { code: 'ENOENT' });
  run(['install', '-s', 'demo', '-a', 'claude-code', '--yes']);
  assert.match(await readFile(join(project, '.claude/skills/demo/SKILL.md'), 'utf8'), /No tools executed/);
  const installed = JSON.parse(run(['list', '--json']));
  assert.equal(installed[0].runtime.platformStatus, 'mismatch');
  assert.equal(installed[0].requirements.notes[0], 'Declared requirement only');
  assert.match(run(['list']), /NonexistentTool123/);
  run(['remove', '-s', 'demo', '--yes']);
  await assert.rejects(() => access(join(project, '.claude/skills/demo')), { code: 'ENOENT' });
});
