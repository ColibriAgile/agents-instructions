import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadCatalog, readSkillMeta } from '../dist/catalog.js';
import { manifestText, readManifest, saveManifest } from '../dist/manifest.js';
import { skillFolderCount } from './skill-folders.mjs';

test('AC2: bundled catalog is complete, every bundle skill has a folder and no skill is without a bundle', async () => {
  const catalog = await loadCatalog();
  const expected = skillFolderCount();
  assert.equal(catalog.skills.length, expected);
  assert.ok(Object.keys(catalog.bundles).includes('core'));
  assert.deepEqual(catalog.skills.filter(s => !s.bundles.length).map(s => s.name), []);
  assert.deepEqual(catalog.warnings, []);
});

test('AC2: manifest round trip retains external sources and unknown settings, adds core only for managed bundles', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'colibri manifest '));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const path = join(dir, 'skills.yaml');
  await writeFile(path, '# keep this comment\nbundles: [frontend]\nsources:\n  - repo: example/skills\n    skills: [external-skill]\nteam: colibri\n');
  const manifest = await readManifest(path);
  await saveManifest(path, manifest, manifestText(manifest, { bundles: ['frontend'], skills: ['commit', 'commit'], sources: manifest.sources }));
  const next = await readManifest(path);
  assert.deepEqual(next.bundles, ['core', 'frontend']);
  assert.deepEqual(next.skills, ['commit']);
  assert.deepEqual(next.sources, [{ repo: 'example/skills', skills: ['external-skill'] }]);
  assert.equal(next.document.get('team'), 'colibri');
  const text = await readFile(path, 'utf8');
  assert.match(text, /keep this comment/);
  // Block style: the engine and the mod read skills.yaml line by line.
  assert.match(text, /bundles:\n  - core\n  - frontend\n/);
  assert.match(text, /sources:\n  - repo: example\/skills\n    skills:\n      - external-skill\n/);
  // A manifest that changed after the preview is not overwritten.
  await writeFile(path, 'bundles: [core]\n');
  await assert.rejects(() => saveManifest(path, next, 'bundles: []\n'), /O manifesto mudou desde a prévia/);
});

test('AC2: invalid manifests and invalid catalog references fail before writes', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'colibri invalid '));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const path = join(dir, 'skills.yaml');
  for (const text of ['bundles: [', 'bundles: dotnet', 'sources: [{repo: example/skills}]', 'skills: [../bad]', 'sources: [{repo: --upload-pack=x, skills: [a]}]', 'sources: [{repo: ../x, skills: [a]}]']) {
    await writeFile(path, text);
    await assert.rejects(() => readManifest(path));
    assert.equal(await readFile(path, 'utf8'), text);
  }
  await mkdir(join(dir, 'SKILLS'), { recursive: true });
  await writeFile(join(dir, 'bundles.yaml'), 'repo: test/repo\nbundles:\n  core:\n    description: Core\n    skills: [missing]\n');
  await assert.rejects(() => loadCatalog(dir), /missing/);
});

test('CR-09: readSkillMeta reads valid frontmatter and rejects missing or incomplete metadata', () => {
  assert.deepEqual(readSkillMeta('---\r\nname: demo\r\ndescription: Demo\r\n---\r\nBody', 'demo'), { name: 'demo', description: 'Demo' });
  assert.throws(() => readSkillMeta('No frontmatter', 'demo/SKILL.md'), /Frontmatter ausente: demo\/SKILL\.md/);
  assert.throws(() => readSkillMeta('---\nname: demo\n---\n', 'demo/SKILL.md'), /Metadados inválidos: demo\/SKILL\.md/);
  assert.throws(() => readSkillMeta('---\nname: Bad Name\ndescription: x\n---\n', 'demo'), /Nome de skill inválido/);
});
