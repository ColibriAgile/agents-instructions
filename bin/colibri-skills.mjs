#!/usr/bin/env node
import { readFile } from 'node:fs/promises';

// Check before loading CLI dependencies: npm's engines warning does not prevent execution.
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const required = pkg.engines.node;
const minimum = required.slice(2).split('.').map(Number);
const current = process.versions.node.split('.').map(Number);
const difference = current.findIndex((part, index) => part !== minimum[index]);
const supported = !process.versions.node.includes('-')
  && (difference === -1 || current[difference] > minimum[difference]);

if (!supported) {
  console.error(`Erro: ${pkg.name} requer Node.js ${required}; detectado v${process.versions.node}. Atualize o Node.js e execute o comando novamente.`);
  process.exitCode = 1;
} else {
  await import('../dist/cli.js');
}
