import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

// The engine is a copy of a file of the herdr-mods repository (ADR-002). A local edit of the copy makes the mod
// and the CLI give different results: change the file there and run `npm run engine:sync`.
test('P14: engine/link-skills.mjs is the file that engine/ENGINE.json records', async () => {
  const record = JSON.parse(await readFile(new URL('../engine/ENGINE.json', import.meta.url), 'utf8'));
  // The hash is of the text with LF: a checkout with another line ending is still the same file.
  const text = (await readFile(new URL('../engine/link-skills.mjs', import.meta.url), 'utf8')).replace(/\r\n/g, '\n');
  assert.equal(createHash('sha256').update(text).digest('hex'), record.sha256, 'Não edite engine/link-skills.mjs aqui: mude no herdr-mods e rode npm run engine:sync.');
  assert.match(record.commit, /^[0-9a-f]{40}$/);
});
