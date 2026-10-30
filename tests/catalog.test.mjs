import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadCatalog, resolveSelection } from '../dist/catalog.js';
import { readManifest, saveManifest } from '../dist/manifest.js';

test('AC2: bundled catalog is complete and every bundle resolves', async () => {
  const catalog = await loadCatalog();
  assert.equal(catalog.skills.length, 69);
  assert.equal(Object.keys(catalog.bundles).length, 12);
  const selection = resolveSelection(catalog, { bundles: Object.keys(catalog.bundles) });
  assert.equal(selection.length, 69);
  assert.equal(new Set(selection.map(s => s.name)).size, 69);
  assert.throws(() => resolveSelection(catalog, { bundles: ['missing'] }), /Unknown bundle/);
  assert.throws(() => resolveSelection(catalog, { skills: ['../escape'] }), /Invalid skill name/);
  assert.throws(() => resolveSelection(catalog, { skills: ['missing'] }), /Unknown skill/);
});

test('AC2: manifest round trip retains external sources and unknown settings, adds core only for managed bundles', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'colibri manifest '));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const path = join(dir, 'skills.yaml');
  await writeFile(path, '# keep this comment\nbundles: [frontend]\nsources:\n  - repo: example/skills\n    skills: [external-skill]\nteam: colibri\n');
  const catalog = await loadCatalog();
  const manifest = await readManifest(path);
  await saveManifest(path, manifest, ['frontend'], ['commit']);
  const next = await readManifest(path);
  assert.deepEqual(next.bundles, ['core', 'frontend']);
  assert.deepEqual(next.sources, [{ repo: 'example/skills', skills: ['external-skill'] }]);
  assert.equal(next.document.get('team'), 'colibri');
  assert.match(await readFile(path, 'utf8'), /keep this comment/);
  const resolved = resolveSelection(catalog, { manifest: next });
  assert.equal(resolved.filter(s => s.name === 'commit').length, 1);
  assert.equal(resolved.find(s => s.name === 'external-skill').source, 'example/skills');
  assert.deepEqual(resolveSelection(catalog, { skills: ['commit', 'commit'] }).map(s => s.name), ['commit']);
  assert.equal(resolveSelection(catalog, { bundles: ['frontend'] }).some(s => s.name === 'commit'), false);
});

test('AC2: invalid manifests and invalid catalog references fail before writes', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'colibri invalid '));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const path = join(dir, 'skills.yaml');
  for (const text of ['bundles: [', 'bundles: dotnet', 'sources: [{repo: example/skills}]', 'skills: [../bad]']) {
    await writeFile(path, text);
    await assert.rejects(() => readManifest(path));
    assert.equal(await readFile(path, 'utf8'), text);
  }
  await mkdir(join(dir, 'SKILLS'), { recursive: true });
  await writeFile(join(dir, 'bundles.yaml'), 'repo: test/repo\nbundles:\n  core:\n    description: Core\n    skills: [missing]\n');
  await assert.rejects(() => loadCatalog(dir), /missing/);
});
