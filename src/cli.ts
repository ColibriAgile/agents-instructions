import { Command } from 'commander';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { packageRoot } from './catalog.js';
import { runCommand } from './commands.js';
import type { Options } from './commands.js';
import { wizard } from './wizard.js';

const pkg = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8')) as { version: string };
// Commander only ships English texts. Subcommands inherit these settings, so they must be set before program.command().
const titles: Record<string, string> = { 'Usage:': 'Uso:', 'Options:': 'Opções:', 'Commands:': 'Comandos:', 'Arguments:': 'Argumentos:', 'Global Options:': 'Opções globais:' };
// Only the usage errors this CLI can produce are rewritten; anything else is shown untouched rather than hidden.
const usageErrors: [RegExp, string | ((...groups: string[]) => string)][] = [
  [/^error: unknown option '([^']+)'/, "Erro: opção desconhecida '$1'"],
  [/^error: unknown command '([^']+)'/, "Erro: comando desconhecido '$1'"],
  [/^error: option '([^']+)' argument missing/, "Erro: falta o valor da opção '$1'"],
  [/^error: missing required argument '([^']+)'/, "Erro: falta o argumento obrigatório '$1'"],
  [/^error: too many arguments(?: for '([^']+)')?\. Expected (\d+) arguments? but got (\d+): (.*)\./,
    (_, command, expected, received, details) => `Erro: argumentos demais${command ? ` para '${command}'` : ''}. Esperados ${expected}, recebidos ${received}: ${details}.`],
  [/\(Did you mean one of (.+)\?\)/, '(Você quis dizer um destes: $1?)'],
  [/\(Did you mean (.+)\?\)/, '(Você quis dizer $1?)'],
];
function translateUsageError(text: string): string {
  return usageErrors.reduce((result, [pattern, replacement]) => result.replace(pattern, replacement as string), text);
}

const program = new Command().name('colibri-skills').description('Instala e gerencia as skills de agentes da Colibri no Windows, macOS e Linux')
  .configureHelp({ styleTitle: (title: string) => titles[title] ?? title })
  .configureOutput({ outputError: (text, write) => write(translateUsageError(text)) })
  .helpOption('-h, --help', 'Exibe a ajuda do comando')
  .helpCommand('help [command]', 'Exibe a ajuda de um comando')
  .version(pkg.version, '-V, --version', 'Exibe o número da versão');

function common(command: Command): Command {
  return command
    .option('--cwd <path>', 'Diretório do projeto de destino (padrão: diretório atual)')
    .option('--catalog <path>', 'Usa uma raiz de catálogo local (bundles.yaml e SKILLS/)')
    .option('-g, --global', 'Usa o escopo do usuário em vez do projeto')
    .option('-a, --agent <names...>', 'Agentes de destino: claude-code, codex, cursor, github-copilot, opencode, windsurf')
    .option('--json', 'Exibe a saída em JSON legível por máquina');
}

common(program).action(async (options: Options) => { await wizard(options); });

for (const action of ['install', 'update', 'remove', 'reconcile'] as const) {
  const command = common(program.command(action).description({
    install: 'Instala skills do catálogo, bundles ou o manifesto do projeto', update: 'Atualiza as skills selecionadas gerenciadas pela Colibri',
    remove: 'Remove as skills selecionadas gerenciadas pela Colibri', reconcile: 'Lista ou remove extras gerenciados fora do skills.yaml',
  }[action]))
    .option('-s, --skill <names...>', 'Seleciona skills pelo nome (separadas por espaço ou vírgula)')
    .option('-y, --yes', 'Aplica a prévia sem pedir confirmação')
    .option('-f, --force', 'Substitui ou remove explicitamente conteúdo de skill em conflito ou modificado')
    .option('--dry-run', 'Mostra o plano sem alterar arquivos');
  if (action === 'install') command.option('-b, --bundle <names...>', 'Instala bundles; os bundles locais são salvos com core no skills.yaml').option('--method <method>', 'copy ou symlink (padrão: copy ou o último método usado)').option('--manifest <path>', 'Caminho do manifesto do projeto (padrão: skills.yaml)');
  if (action === 'reconcile') command.option('--manifest <path>', 'Caminho do manifesto do projeto (padrão: skills.yaml)');
  command.action(async (options: Options) => { await runCommand(action, { ...program.opts<Options>(), ...options }); });
}

common(program.command('list').alias('ls').description('Lista as instalações gerenciadas pela Colibri ou navega pelo catálogo embutido'))
  .option('--available', 'Lista as skills disponíveis no catálogo em vez das instalações gerenciadas')
  .action(async (options: Options) => { await runCommand('list', { ...program.opts<Options>(), ...options }); });

try { await program.parseAsync(); }
catch (error) { console.error(`Erro: ${error instanceof Error ? error.message : String(error)}`); process.exitCode ||= 1; }
