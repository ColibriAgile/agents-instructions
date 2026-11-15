import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const entry = resolve('bin/colibri-skills.mjs');
const git = (dir, ...args) => spawnSync('git', ['-C', dir, '-c', 'user.name=t', '-c', 'user.email=t@t.example', ...args], { encoding: 'utf8' });

/** A work repository, its bare origin, and a clone of the origin. */
async function repository(base, name, files) {
  const work = join(base, `${name}-work`);
  for (const [path, text] of Object.entries(files)) { await mkdir(join(work, path, '..'), { recursive: true }); await writeFile(join(work, path), text); }
  git(work, 'init', '-q', '-b', 'main'); git(work, 'add', '-A'); git(work, 'commit', '-qm', 'first');
  const origin = join(base, `${name}.git`);
  spawnSync('git', ['clone', '-q', '--bare', work, origin]);
  git(work, 'remote', 'add', 'origin', origin);
  return { work, origin };
}
const publish = async (work, path, text) => { await writeFile(join(work, path), text); git(work, 'add', '-A'); git(work, 'commit', '-qm', 'next'); git(work, 'push', '-q', 'origin', 'main'); };

test('update: traz o clone do catálogo e os clones de outros repositórios; --dry-run e um clone com mudanças não mudam nada', async t => {
  const base = await mkdtemp(join(tmpdir(), 'colibri-update-'));
  t.after(() => rm(base, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }));
  const skill = name => `---\nname: ${name}\ndescription: Skill ${name}.\n---\nv1\n`;
  const cat = await repository(base, 'catalog', { 'bundles.yaml': 'repo: test/catalog\nbundles:\n  core:\n    description: Core\n    skills:\n      - alpha\n', 'SKILLS/alpha/SKILL.md': skill('alpha') });
  const src = await repository(base, 'source', { 'skills/omega/SKILL.md': skill('omega') });
  const catalog = join(base, 'catalog');
  const sources = join(base, 'sources');
  const clone = join(sources, 'someone', 'skills');
  spawnSync('git', ['clone', '-q', cat.origin, catalog]);
  await mkdir(join(sources, 'someone'), { recursive: true });
  spawnSync('git', ['clone', '-q', src.origin, clone]);
  const run = (...args) => spawnSync(process.execPath, [entry, 'update', ...args, '--catalog', catalog], { cwd: base, encoding: 'utf8', env: { ...process.env, COLIBRI_SKILLS_SOURCES: sources } });

  const current = run();
  assert.equal(current.status, 0, current.stderr);
  assert.match(current.stdout, /catálogo · em dia\nsomeone\/skills · em dia/);
  assert.match(current.stdout, /Os projetos veem a versão nova na hora/);

  await publish(cat.work, 'SKILLS/alpha/SKILL.md', skill('alpha').replace('v1', 'v2'));
  await publish(src.work, 'skills/omega/SKILL.md', skill('omega').replace('v1', 'v2'));
  const dry = run('--dry-run');
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(dry.stdout, /catálogo · não atualizado \(simulação: git pull --ff-only\)/);
  assert.match(dry.stdout, /someone\/skills · não atualizado \(simulação: git fetch e git reset --hard origin\/HEAD\)/);
  assert.match(await readFile(join(catalog, 'SKILLS/alpha/SKILL.md'), 'utf8'), /v1/);
  assert.match(await readFile(join(clone, 'skills/omega/SKILL.md'), 'utf8'), /v1/);

  // A catalog with changes that are not committed is not pulled; the other clones still update.
  await writeFile(join(catalog, 'bundles.yaml'), (await readFile(join(catalog, 'bundles.yaml'), 'utf8')) + '# edição local\n');
  const dirty = run();
  assert.equal(dirty.status, 0, dirty.stderr);
  assert.match(dirty.stdout, /catálogo · não atualizado \(o clone tem mudanças sem commit\)/);
  assert.match(dirty.stdout, /someone\/skills · atualizado \(1 commit\(s\)\)/);
  assert.match(await readFile(join(catalog, 'SKILLS/alpha/SKILL.md'), 'utf8'), /v1/);
  assert.match(await readFile(join(clone, 'skills/omega/SKILL.md'), 'utf8'), /v2/);
  assert.match(await readFile(join(catalog, 'bundles.yaml'), 'utf8'), /# edição local/);

  git(catalog, 'checkout', '-q', '--', 'bundles.yaml');
  const json = JSON.parse(run('--json').stdout);
  assert.deepEqual(json, [{ repo: 'catalog', status: 'updated' }, { repo: 'someone/skills', status: 'current' }]);
  assert.match(await readFile(join(catalog, 'SKILLS/alpha/SKILL.md'), 'utf8'), /v2/);
});
