import { Command } from 'commander';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { packageRoot } from './catalog.js';
import { runCommand } from './commands.js';
import type { Options } from './commands.js';
import { wizard } from './wizard.js';

const pkg = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8')) as { version: string };
const program = new Command().name('colibri-skills').description('Install and manage Colibri agent skills on Windows, macOS and Linux').version(pkg.version);

function common(command: Command): Command {
  return command
    .option('--cwd <path>', 'Target project directory (defaults to current directory)')
    .option('--catalog <path>', 'Use a local catalog root (bundles.yaml and SKILLS/)')
    .option('-g, --global', 'Use user scope instead of the project')
    .option('-a, --agent <names...>', 'Target agents: claude-code, codex, cursor, github-copilot, opencode, windsurf')
    .option('--json', 'Output machine-readable JSON');
}

common(program).action(async (options: Options) => { await wizard(options); });

for (const action of ['install', 'update', 'remove', 'reconcile'] as const) {
  const command = common(program.command(action).description({
    install: 'Install catalog skills, bundles or the project manifest', update: 'Update selected Colibri-managed skills',
    remove: 'Remove selected Colibri-managed skills', reconcile: 'List or remove managed extras outside skills.yaml',
  }[action]))
    .option('-s, --skill <names...>', 'Select skill names (space-separated or comma-separated)')
    .option('-y, --yes', 'Apply the preview without a confirmation prompt')
    .option('-f, --force', 'Explicitly replace/remove conflicting or modified skill content')
    .option('--dry-run', 'Show the plan without changing files');
  if (action === 'install') command.option('-b, --bundle <names...>', 'Install bundles; local bundles are saved with core in skills.yaml').option('--method <method>', 'copy or symlink (default: copy or last used method)').option('--manifest <path>', 'Project manifest path (default: skills.yaml)');
  if (action === 'reconcile') command.option('--manifest <path>', 'Project manifest path (default: skills.yaml)');
  command.action(async (options: Options) => { await runCommand(action, { ...program.opts<Options>(), ...options }); });
}

common(program.command('list').alias('ls').description('List Colibri-managed installations, or browse the bundled catalog'))
  .option('--available', 'List available catalog skills instead of managed installations')
  .action(async (options: Options) => { await runCommand('list', { ...program.opts<Options>(), ...options }); });

try { await program.parseAsync(); }
catch (error) { console.error(`Error: ${error instanceof Error ? error.message : String(error)}`); process.exitCode ||= 1; }
