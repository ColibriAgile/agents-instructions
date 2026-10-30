import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

// The external executable is the system boundary; Colibri modules remain real.
test('R1: backend success without a valid installed SKILL.md is rejected', async t => {
  const root = await mkdtemp(join(tmpdir(), 'colibri backend contract '));
  t.after(() => rm(root, { recursive: true, force: true }));
  const consumer = join(root, 'consumer');
  const project = join(root, 'project');
  await mkdir(project);
  await mkdir(join(consumer, 'node_modules/skills/bin'), { recursive: true });
  for (const name of ['dist', 'bin', 'package.json', 'bundles.yaml', 'skill-requirements.yaml', 'SKILLS']) {
    await cp(resolve(name), join(consumer, name), { recursive: true });
  }
  for (const name of ['yaml', 'commander', '@clack/prompts']) {
    await mkdir(join(consumer, 'node_modules', name, '..'), { recursive: true });
    await symlink(resolve('node_modules', name), join(consumer, 'node_modules', name), process.platform === 'win32' ? 'junction' : 'dir');
  }
  await writeFile(join(consumer, 'node_modules/skills/package.json'), '{"name":"skills","type":"module"}');
  const fake = join(consumer, 'node_modules/skills/bin/cli.mjs');
  for (const content of ['', 'invalid metadata', '---\nname: other\ndescription: Other skill\n---\n']) {
    await writeFile(fake, `
      import { mkdir, writeFile } from 'node:fs/promises';
      import { join } from 'node:path';
      const dest = join(process.cwd(), '.claude/skills/commit');
      await mkdir(dest, { recursive: true });
      ${content ? `await writeFile(join(dest, 'SKILL.md'), ${JSON.stringify(content)});` : ''}
      console.log(JSON.stringify([{ name: 'commit', status: 'installed', mode: 'copy', agents: ['claude-code'] }]));
    `);
    await rm(join(project, '.claude'), { recursive: true, force: true });
    const result = spawnSync(process.execPath, [join(consumer, 'bin/colibri-skills.mjs'), 'install', '--skill', 'commit', '--agent', 'claude-code', '--yes', '--cwd', project], { encoding: 'utf8' });
    assert.notEqual(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stderr, /SKILL.md/);
    await assert.rejects(() => readFile(join(project, '.colibri-skills.json')), { code: 'ENOENT' });
  }
});
