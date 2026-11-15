import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadCatalog } from '../dist/catalog.js';
import { requirementInfo, bundleRequirementHint, summarizeDescription } from '../dist/requirements.js';

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

test('R3: bundle hints carry the restrictions of the skills of the bundle', async () => {
  const catalog = await loadCatalog();
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
    'version: 1\nskills:\n  demo:\n    platforms: [windows]',
    'version: 1\nskills:\n  demo:\n    tools: PowerShell',
    'version: 1\nskills:\n  demo:\n    tools: [""]',
    'version: 1\nskills:\n  demo:\n    toolz: [PowerShell]',
    'version: 1\nskills:\n  demo: {}',
  ]) {
    await writeFile(path, text);
    await assert.rejects(() => loadCatalog(root), /requisito/i);
    assert.equal(await readFile(path, 'utf8'), text);
  }
  // The mod of the Herdr app can delete a skill folder: its entry here only warns (in pt-BR), it does not stop the CLI.
  await writeFile(path, 'version: 1\nskills:\n  missing:\n    tools: [PowerShell]');
  const catalog = await loadCatalog(root);
  assert.equal(catalog.skills[0].requirements, null);
  assert.match(catalog.warnings[0], /skill-requirements\.yaml cita uma skill que o catálogo não tem: missing/);
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

test('R3/R4: JSON exposes requirements; restricted skills remain linkable without tools', async t => {
  const root = await mkdtemp(join(tmpdir(), 'colibri requirement install '));
  t.after(() => rm(root, { recursive: true, force: true }));
  const catalog = join(root, 'catalog');
  const project = join(root, 'project');
  await mkdir(project);
  spawnSync('git', ['-C', project, 'init', '-q']);
  await mkdir(join(catalog, 'SKILLS/demo'), { recursive: true });
  await writeFile(join(catalog, 'SKILLS/demo/SKILL.md'), '---\nname: demo\ndescription: Demo\n---\nNo tools executed\n');
  await writeFile(join(catalog, 'bundles.yaml'), 'repo: test/repo\nbundles:\n  core:\n    description: Core\n    skills: [demo]\n');
  const platform = process.platform === 'win32' ? 'linux' : 'win32';
  await writeFile(join(catalog, 'skill-requirements.yaml'), `version: 1\nskills:\n  demo:\n    platforms: [${platform}]\n    tools: [NonexistentTool123]\n    notes: [Declared requirement only]\n`);
  const run = args => {
    const result = spawnSync(process.execPath, [resolve('bin/colibri-skills.mjs'), ...args, '--cwd', project, '--catalog', catalog], { encoding: 'utf8', timeout: 30000, env: { ...process.env, HOME: root, USERPROFILE: root, COLIBRI_SKILLS_SOURCES: join(root, 'sources') } });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    return result.stdout;
  };
  const plan = JSON.parse(run(['install', '-s', 'demo', '--dry-run', '--json']));
  assert.deepEqual(plan.link, ['demo']);
  // The preview on screen carries the declared requirements of the skill.
  assert.match(run(['install', '-s', 'demo', '--dry-run']), /demo · Requer .* e NonexistentTool123 · Sistema atual: /);
  await assert.rejects(() => access(join(project, '.claude')), { code: 'ENOENT' });
  run(['install', '-s', 'demo', '--yes']);
  assert.match(await readFile(join(project, '.claude/skills/demo/SKILL.md'), 'utf8'), /No tools executed/);
  const installed = JSON.parse(run(['list', '--json']));
  assert.equal(installed[0].runtime.platformStatus, 'mismatch');
  assert.equal(installed[0].requirements.notes[0], 'Declared requirement only');
  assert.match(run(['list']), /NonexistentTool123/);
  run(['remove', '-s', 'demo', '--yes']);
  await assert.rejects(() => access(join(project, '.claude/skills/demo')), { code: 'ENOENT' });
});

test('CR-11: summarizeDescription keeps the first sentence and caps long text', () => {
  assert.equal(summarizeDescription('Short one. Second sentence.'), 'Short one.');
  assert.equal(summarizeDescription('No period here'), 'No period here');
  const long = summarizeDescription(`${'word '.repeat(60)}end. More.`);
  assert.equal(long.length, 120);
  assert.ok(long.endsWith('…'));
  assert.equal(summarizeDescription('Multi\n  line\ttext. Next.'), 'Multi line text.');
});

test('CR-13: list --available and the install preview print the unknown-requirements notice once', async t => {
  const root = await mkdtemp(join(tmpdir(), 'colibri notice '));
  t.after(() => rm(root, { recursive: true, force: true }));
  const catalog = join(root, 'catalog');
  for (const name of ['alpha', 'beta']) {
    await mkdir(join(catalog, 'SKILLS', name), { recursive: true });
    await writeFile(join(catalog, 'SKILLS', name, 'SKILL.md'), `---\nname: ${name}\ndescription: First sentence of ${name}. Second sentence that must not appear.\n---\n`);
  }
  await writeFile(join(catalog, 'bundles.yaml'), 'repo: test/catalog\nbundles:\n  core:\n    description: Core\n    skills: [alpha, beta]\n');
  spawnSync('git', ['-C', root, 'init', '-q']);
  const run = args => spawnSync(process.execPath, [resolve('bin/colibri-skills.mjs'), ...args, '--cwd', root, '--catalog', catalog], { encoding: 'utf8', timeout: 30000, env: { ...process.env, HOME: root, USERPROFILE: root, COLIBRI_SKILLS_SOURCES: join(root, 'sources') } });
  const count = text => text.split('Ausência de requisitos catalogados').length - 1;
  const list = run(['list', '--available']);
  assert.equal(list.status, 0, list.stderr);
  assert.equal(count(list.stdout), 1);
  assert.doesNotMatch(list.stdout, /Second sentence/);
  const dry = run(['install', '-s', 'alpha,beta', '--dry-run']);
  assert.equal(dry.status, 0, dry.stderr);
  assert.equal(count(dry.stdout), 1);
  const json = JSON.parse(run(['list', '--available', '--json']).stdout);
  assert.match(json[0].description, /Second sentence/);
});
