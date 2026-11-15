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
// Only the usage errors this CLI can produce are rewritten, each covered by a CLI test; anything else is shown untouched.
const usageErrors: [RegExp, string | ((...groups: string[]) => string)][] = [
  [/^error: unknown option '([^']+)'/, "Erro: opção desconhecida '$1'"],
  [/^error: option '([^']+)' argument missing/, "Erro: falta o valor da opção '$1'"],
  [/^error: missing required argument '([^']+)'/, "Erro: falta o argumento '$1'"],
  [/^error: too many arguments(?: for '([^']+)')?\. Expected (\d+) arguments? but got (\d+): (.*)\./,
    (_, command, expected, received, details) => `Erro: argumentos demais${command ? ` para '${command}'` : ''}. Esperados ${expected}, recebidos ${received}: ${details}.`],
  [/\(Did you mean (.+)\?\)/, '(Você quis dizer $1?)'],
];
function translateUsageError(text: string): string {
  return usageErrors.reduce((result, [pattern, replacement]) => result.replace(pattern, replacement as string), text);
}

const program = new Command().name('colibri-skills')
  .description('Gerencia as skills de agentes da Colibri: links dos projetos para o clone do catálogo (Windows, macOS e Linux)')
  .configureHelp({ styleTitle: (title: string) => titles[title] ?? title })
  .configureOutput({ outputError: (text, write) => write(translateUsageError(text)) })
  .helpOption('-h, --help', 'Exibe a ajuda do comando')
  .helpCommand('help [command]', 'Exibe a ajuda de um comando')
  .version(pkg.version, '-V, --version', 'Exibe o número da versão');

function common(command: Command, project = true): Command {
  if (project) command.option('--cwd <path>', 'Pasta do projeto (padrão: pasta atual); o projeto é a raiz Git dela');
  return command
    .option('--catalog <path>', 'Usa outro clone do catálogo (bundles.yaml e SKILLS/); padrão: este clone')
    .option('--json', 'Exibe a saída em JSON legível por máquina');
}
const change = (command: Command): Command => command
  .option('-y, --yes', 'Aplica a prévia sem pedir confirmação')
  .option('--dry-run', 'Mostra o plano sem alterar arquivos');
const skills = (command: Command, text: string): Command => command.option('-s, --skill <names...>', text);
const bundles = (command: Command, text: string): Command => command.option('-b, --bundle <names...>', text);
const run = (action: string) => async (...args: unknown[]) => {
  // Commander passes the arguments first, then the options, then the command.
  const options = args.at(-2) as Options;
  const argument = typeof args[0] === 'string' ? args[0] : undefined;
  await runCommand(action, { ...program.opts<Options>(), ...options }, undefined, argument);
};

common(program).action(async (options: Options) => { await wizard(options); });

common(program.command('list').alias('ls').description('Lista as skills do projeto com o estado de cada uma, ou o catálogo'))
  .option('--available', 'Lista as skills do catálogo em vez das skills do projeto')
  .action(run('list'));

bundles(skills(change(common(program.command('install')
  .description('Cria os links que faltam, troca cópias por links e remove os links que sobram; com --bundle ou --skill, adiciona ao projeto'))),
'Vincula skills avulsas (extras); com --keep, grava no skills.yaml'),
'Adiciona bundles ao skills.yaml do projeto (o core entra sempre)')
  .option('--replace', 'Com --bundle: troca os bundles do skills.yaml pelos escolhidos')
  .option('--keep', 'Com --skill: grava as skills no skills.yaml em vez de deixar como extras')
  .option('--repo <repo>', 'Com --skill: as skills vêm de outro repositório (owner/nome ou URL Git)')
  .option('-f, --force', 'Substitui por link as pastas do projeto em conflito (a pasta vai para .agents/skills-backup)')
  .action(run('install'));

skills(change(common(program.command('remove').description('Tira skills do skills.yaml e remove os links delas'))), 'Skills a remover')
  .option('-f, --force', 'Apaga também uma skill local (pasta criada à mão no projeto)')
  .action(run('remove'));

change(common(program.command('update').description('Atualiza o clone do catálogo (git pull) e os clones de outros repositórios'), false)).action(run('update'));

const catalog = program.command('catalog').description('Gerencia o catálogo no clone: bundles de cada skill, skills sem bundle, remoção');
common(catalog.command('orphans').description('Lista as skills do clone que não estão em nenhum bundle'), false).action(run('catalog:orphans'));
bundles(skills(change(common(catalog.command('assign').description('Põe skills em bundles do bundles.yaml'), false)), 'Skills a associar'), 'Bundles de destino')
  .option('--description <text>', 'Cria o bundle (um só) com esta descrição, quando ele não existe')
  .action(run('catalog:assign'));
bundles(skills(change(common(catalog.command('unassign').description('Tira skills de bundles do bundles.yaml'), false)), 'Skills a tirar'), 'Bundles de origem').action(run('catalog:unassign'));
bundles(change(common(catalog.command('bundle-delete').description('Apaga bundles do bundles.yaml (as pastas das skills ficam; nunca o core)'), false)), 'Bundles a apagar').action(run('catalog:bundle-delete'));
skills(change(common(catalog.command('skill-delete').description('Apaga a pasta da skill do clone e tira a skill de todos os bundles'), false)), 'Skills a apagar').action(run('catalog:skill-delete'));

skills(change(common(program.command('import').argument('<repo>', 'Repositório de origem (owner/nome ou URL Git)')
  .description('Traz skills de um repositório externo para SKILLS/ do clone'), false)), 'Skills a trazer')
  .option('-f, --force', 'Substitui uma skill que já existe em SKILLS/')
  .action(run('import'));

common(program.command('model-invocation').description('Cria agents/openai.yaml nas skills com disable-model-invocation: true'), false)
  .option('--dry-run', 'Mostra o que seria criado sem alterar arquivos')
  .action(run('model-invocation'));

try { await program.parseAsync(); }
catch (error) { console.error(`Erro: ${error instanceof Error ? error.message : String(error)}`); process.exitCode ||= 1; }
