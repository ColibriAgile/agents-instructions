#!/usr/bin/env node
// Atualiza engine/link-skills.mjs a partir de um clone do repositório herdr-mods.
// Uso: npm run engine:sync -- <pasta do clone do herdr-mods>
// O motor é o mesmo arquivo que o mod skill-bundles do Herdr usa (ADR-002). Nunca edite a cópia daqui:
// mude o arquivo no herdr-mods e rode este script.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const origin = process.argv[2];
if (!origin) { console.error('Uso: npm run engine:sync -- <pasta do clone do herdr-mods>'); process.exit(1); }
const path = 'skill-bundles-app/mods/skill-bundles/link-skills.mjs';
// O arquivo fica com LF (veja .gitattributes): o hash é do texto com LF.
const text = readFileSync(join(origin, path), 'utf8').replace(/\r\n/g, '\n');
const commit = execFileSync('git', ['-C', origin, 'log', '-1', '--format=%H', '--', path], { encoding: 'utf8' }).trim();
writeFileSync(join(root, 'engine', 'link-skills.mjs'), text);
writeFileSync(join(root, 'engine', 'ENGINE.json'), `${JSON.stringify({
  source: 'https://github.com/dougcunha/herdr-mods',
  path,
  commit,
  sha256: createHash('sha256').update(text).digest('hex'),
}, null, 2)}\n`);
console.log(`engine/link-skills.mjs atualizado para ${commit.slice(0, 7)}.`);