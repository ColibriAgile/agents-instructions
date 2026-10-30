import { test } from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadCatalog } from '../dist/catalog.js';
import { prepareInstall, prepareReconcile, installedRows } from '../dist/commands.js';
import { executePlan } from '../dist/manager.js';
import { readManifest } from '../dist/manifest.js';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'colibri manifest race '));
  const project = join(root, 'project');
  const catalogRoot = join(root, 'catalog');
  const home = join(root, 'home');
  await mkdir(project);
  await mkdir(home);
  const previous = { HOME: process.env.HOME, USERPROFILE: process.env.USERPROFILE };
  process.env.HOME = home;
  process.env.USERPROFILE = home;
  t.after(async () => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
    await rm(root, { recursive: true, force: true });
  });
  for (const name of ['essential', 'alpha', 'beta']) {
    await mkdir(join(catalogRoot, 'SKILLS', name), { recursive: true });
    await writeFile(join(catalogRoot, 'SKILLS', name, 'SKILL.md'), `---\nname: ${name}\ndescription: ${name}\n---\nContent\n`);
  }
  await writeFile(join(catalogRoot, 'bundles.yaml'), 'repo: test/catalog\nbundles:\n  core:\n    description: Core\n    skills: [essential]\n  a:\n    description: A\n    skills: [alpha]\n  b:\n    description: B\n    skills: [beta]\n');
  const catalog = await loadCatalog(catalogRoot);
  const options = { cwd: project, agent: ['claude-code'], bundle: ['a'] };
  const manifest = join(project, 'skills.yaml');
  const apply = prepared => executePlan(prepared.plan, false, prepared.save);
  return { project, catalog, options, manifest, apply };
}

test('E2: a confirmed older plan cannot overwrite a newer manifest or install stale selections', async t => {
  const { project, catalog, options, manifest, apply } = await fixture(t);
  await writeFile(manifest, 'bundles: []\nteam: initial\n');
  const older = await prepareInstall(catalog, options);
  const newer = await prepareInstall(catalog, { ...options, bundle: ['b'] });
  await apply(newer);
  const saved = await readFile(manifest, 'utf8');
  await assert.rejects(() => apply(older), /manifest changed.*preview/i);
  assert.equal(await readFile(manifest, 'utf8'), saved);
  await assert.rejects(() => access(join(project, '.claude/skills/alpha')), { code: 'ENOENT' });
  assert.deepEqual((await installedRows({ cwd: project, global: false })).map(s => s.name).sort(), ['beta', 'essential']);
  await apply(await prepareInstall(catalog, options));
  assert.deepEqual((await readManifest(manifest)).bundles.sort(), ['a', 'b', 'core']);
});

test('E2: creating, deleting or editing a manifest invalidates its pending plan before writes', async t => {
  for (const change of ['create-empty', 'delete', 'edit-sources', 'read-only-manifest']) {
    const { project, catalog, options, manifest, apply } = await fixture(t);
    if (change !== 'create-empty') await writeFile(manifest, 'bundles: [a]\nteam: initial\n');
    const prepared = await prepareInstall(catalog, change === 'read-only-manifest' ? { ...options, bundle: undefined } : options);
    const edited = 'bundles: [b]\nteam: newly-edited\nsources:\n  - repo: org/external\n    skills: [external]\n';
    if (change === 'create-empty') await writeFile(manifest, '');
    else if (change === 'delete') await rm(manifest);
    else await writeFile(manifest, edited);
    await assert.rejects(() => apply(prepared), /manifest changed.*preview/i);
    if (change === 'delete') await assert.rejects(() => access(manifest), { code: 'ENOENT' });
    else assert.equal(await readFile(manifest, 'utf8'), change === 'create-empty' ? '' : edited);
    assert.deepEqual(await installedRows({ cwd: project, global: false }), []);
    await assert.rejects(() => access(join(project, '.claude/skills/alpha')), { code: 'ENOENT' });
  }
});

test('E2: edits made during installation are preserved when the prepared manifest is saved', async t => {
  const { project, catalog, options, manifest } = await fixture(t);
  await writeFile(manifest, 'bundles: []\nteam: initial\n');
  const prepared = await prepareInstall(catalog, options);
  const edited = '# manual edit during install\nbundles: []\nteam: newer\n';
  await assert.rejects(() => executePlan(prepared.plan, false, async () => {
    await writeFile(manifest, edited);
    await prepared.save();
  }), /manifest changed.*preview/i);
  assert.equal(await readFile(manifest, 'utf8'), edited);
  assert.deepEqual((await installedRows({ cwd: project, global: false })).map(s => s.name).sort(), ['alpha', 'essential']);
});

test('E2: a reconcile plan is refused when the manifest changed or was deleted after its preview', async t => {
  for (const change of ['require-extra', 'delete', 'unchanged']) {
    const { project, catalog, options, manifest, apply } = await fixture(t);
    await writeFile(manifest, 'bundles: [core, a]\n');
    await apply(await prepareInstall(catalog, options));
    await apply(await prepareInstall(catalog, { cwd: project, agent: ['claude-code'], skill: ['beta'] }));
    const { extras, plan } = await prepareReconcile(catalog, { cwd: project, skill: ['beta'] });
    assert.deepEqual(extras, ['beta']);
    if (change === 'require-extra') await writeFile(manifest, 'bundles: [core, a, b]\n');
    else if (change === 'delete') await rm(manifest);
    const installed = async () => (await installedRows({ cwd: project, global: false })).map(s => s.name).sort();
    if (change === 'unchanged') {
      assert.equal((await executePlan(plan)).removed, 1);
      assert.deepEqual(await installed(), ['alpha', 'essential']);
      continue;
    }
    await assert.rejects(() => executePlan(plan), /manifest changed.*preview/i);
    await access(join(project, '.claude/skills/beta/SKILL.md'));
    assert.deepEqual(await installed(), ['alpha', 'beta', 'essential']);
    if (change === 'require-extra') assert.deepEqual((await prepareReconcile(catalog, { cwd: project })).extras, []);
  }
});
