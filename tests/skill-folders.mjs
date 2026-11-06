import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

// Expected catalog size, read from disk so adding or removing a skill does not break the suite.
// Same rule as the catalog: visible folders of SKILLS/ that have a SKILL.md.
export function skillFolderCount(root = resolve('.')) {
  const source = join(root, 'SKILLS');
  return readdirSync(source, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('.') && existsSync(join(source, entry.name, 'SKILL.md')))
    .length;
}
