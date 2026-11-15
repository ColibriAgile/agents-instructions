# Spec: skills como links para o clone

- **Status**: em implementação no branch `feat/links-para-o-clone`
- **ADR**: [ADR-002](../adr/002-skills-como-links-para-o-clone.md)
- **Nota**: o repositório não tem o modelo do `to-spec`. Esta spec usa as seções que a regra `.claude/rules/cli.md`
  pede: o comportamento, os pontos de teste e o roteiro manual do que muda no Windows.

## Problema

O repositório tem 3 formas de pôr skills num projeto, e cada uma tem o seu registro:

| Ferramenta | Como instala | Registro |
| --- | --- | --- |
| Scripts PowerShell (`Install-Skills.ps1` e outros) | Cópias, com `npx skills add` | `skills-lock.json` |
| CLI `colibri-skills` (ADR-001) | Cópias ou symlink para uma cópia do projeto, com o pacote `skills` | `.colibri-skills.json` |
| Mod `skill-bundles` do Herdr | Links para o clone do catálogo | bloco em `.git/info/exclude` |

Uma ferramenta desfaz o trabalho da outra. Uma cópia fica desatualizada em cada projeto, e uma atualização do
catálogo exige uma rodada em todos os projetos.

## Solução

Existe 1 modelo só: **links para o clone**.

- O clone deste repositório é o único lugar com os arquivos das skills e com controle de versão.
- Um projeto recebe, para cada skill, 1 link em cada pasta de agente: `.agents/skills`, `.claude/skills` e
  `.windsurf/skills`. No Windows o link é uma junction de diretório. No macOS e no Linux é um link simbólico.
- Um `git pull` no clone atualiza todos os projetos de uma vez.
- O mod `skill-bundles` é a ferramenta principal. A CLI `colibri-skills` é o fallback para quem não usa o Herdr,
  com as mesmas regras e as mesmas funções.
- As 2 ferramentas usam o mesmo motor: `engine/link-skills.mjs`, 1 arquivo Node sem dependências. A origem do
  arquivo é o repositório `dougcunha/herdr-mods` (`skill-bundles-app/mods/skill-bundles/link-skills.mjs`).
  Este repositório guarda uma cópia. A CLI só pergunta, chama o motor e mostra o resultado em pt-BR.

## O que sai

- O backend `skills` (dependência npm), os métodos `copy` e `symlink`, e o arquivo `.colibri-skills.json`.
- O escopo global (`-g`) e a escolha de agentes (`-a`). As pastas de agente são fixas.
- O plano de publicar no npm. Um link precisa de um clone no computador.
- Os scripts PowerShell de instalação: `Install-Skills.ps1`, `Init-Skills.ps1`, `Configure-Skills.ps1`,
  `Add-Skill.ps1`, `Update-AllSkills.ps1` e `Skills.Common.ps1`.
- `Import-Skill.ps1` e `Configure-ModelInvocation.ps1` viram comandos da CLI.
- A skill `assign-bundles` deixa de usar scripts PowerShell: ela passa a usar `colibri-skills catalog`.

O `link.bat` fica como está: ele não instala skills (cria junctions de `INSTRUCTIONS` e `AGENTS`).

## Termos

Os mesmos do mod (`CONTEXT.md` de `skill-bundles-app`):

| Estado (`--json`) | Na tela | Quando |
| --- | --- | --- |
| `linked` | vinculada | Os 3 links existem e apontam para o clone. |
| `missing` | faltando | O `skills.yaml` pede a skill, mas falta um link, ou ele aponta para outra pasta. |
| `copy` | cópia | Uma pasta real que o `npx skills` ou a CLI antiga instalou. A próxima ação troca por link. |
| `stale` | sobrando | Um link da ferramenta que o `skills.yaml` não pede mais, ou cuja skill saiu do clone. |
| `conflict` | conflito | O `skills.yaml` pede a skill, mas o projeto tem uma pasta própria com o nome, ou o Git rastreia a pasta. |
| `absent` | fora do clone | O `skills.yaml` pede uma skill que o clone não tem. |
| `extra` | extra | Vinculada, mas fora do `skills.yaml`. |
| `local` | local | Uma pasta ou um link que a pessoa criou no projeto. A ferramenta não toca. |
| `unsupported` | sem clone | Skill de outro repositório que ainda não foi clonado. |

## Manifesto (`skills.yaml`)

```yaml
bundles:
  - core
  - dotnet

skills:          # skills do catálogo fora dos bundles do projeto
  - code-review

sources:         # skills de outros repositórios
  - repo: someone/skills
    skills:
      - deslop
```

O arquivo continua com commit no projeto. Os links não têm commit: a ferramenta grava 1 linha por link no
`.git/info/exclude` do projeto. Esse bloco também é o registro dos links que a ferramenta criou. A ferramenta
nunca remove um link que não está no bloco.

## Comandos

O projeto é a raiz Git de `--cwd` (padrão: a pasta atual). Sem Git, a CLI mostra um erro em pt-BR. O clone é a
raiz deste repositório (a pasta do `bin/`), ou `--catalog <pasta>`.

| Comando | O que faz |
| --- | --- |
| `colibri-skills` | Wizard com todas as ações abaixo. |
| `list` | As skills do projeto com o estado de cada uma. `--available` lista o catálogo. |
| `install` | Cria os links que faltam, troca as cópias por links e remove os links que sobram. |
| `install -b <bundles>` | Adiciona bundles ao `skills.yaml` (cria o arquivo, com `core`) e aplica. `--replace` troca os bundles do manifesto pelos escolhidos. |
| `install -s <skills>` | Vincula skills avulsas como Extra. Com `--keep`, grava em `skills:` do `skills.yaml`. Com `--repo <owner/repo>`, a skill vem de outro repositório (`sources:` com `--keep`). |
| `install --force -s <skills>` | Resolve um Conflito: move a pasta do projeto para `.agents/skills-backup/` e cria o link. |
| `remove -s <skills>` | Tira as skills de `skills:` e de `sources:` e remove os links delas. Uma pasta Local só sai com `--force`. |
| `update` | `git pull --ff-only` no clone, e atualização dos clones de outros repositórios. |
| `catalog orphans` | Lista as skills do clone sem bundle. |
| `catalog assign -s <skills> -b <bundles>` | Põe as skills nos bundles. `--description <texto>` cria um bundle novo. |
| `catalog unassign -s <skills> -b <bundles>` | Tira as skills dos bundles. |
| `catalog bundle-delete -b <bundles>` | Apaga bundles do `bundles.yaml` (não as pastas das skills; nunca o `core`). |
| `catalog skill-delete -s <skills>` | Apaga a pasta da skill do clone e tira a skill de todos os bundles e do `skill-requirements.yaml`. |
| `import <repo> -s <skills>` | Traz skills de um repositório externo para `SKILLS/`. |
| `model-invocation` | Cria `agents/openai.yaml` nas skills com `disable-model-invocation: true`. |

Opções comuns: `--cwd`, `--catalog`, `--json`, `-y/--yes`, `--dry-run`.

- Todo comando que muda arquivos mostra uma prévia e pede confirmação, salvo com `--yes`. Sem terminal, a
  confirmação exige `--yes`.
- `--json` mantém os valores em inglês (`state: "linked"`). A tela mostra o texto em pt-BR.
- Os comandos `catalog`, `import` e `model-invocation` mudam o clone e não fazem commit. A pessoa revisa e faz
  commit e push.
- A CLI não escreve nada num projeto num comando de leitura (`list`).

## Conversão de instalações antigas

A primeira ação num projeto (`install`) troca as cópias por links:

- Cópia do `npx skills` (scripts PowerShell): está no `skills-lock.json`.
- Cópia da CLI antiga: está no `skills-lock.json` com a pasta `SKILLS/` do clone como origem, e no
  `.colibri-skills.json`.
- Uma cópia sem mudanças (igual ao hash do lock ou igual ao clone) é apagada.
- Uma cópia com mudanças vai para `.agents/skills-backup/<skill>`. A saída diz quantas foram.
- Uma pasta que o Git rastreia é um Conflito. Só muda com `--force`.
- As skills convertidas saem do `skills-lock.json` e do `.colibri-skills.json`. Um arquivo vazio é apagado.
- Os links antigos em `.codex/skills` são removidos (o Codex lê `.agents/skills`).

## Migração para quem usa o repositório hoje

1. **Hook `post-checkout`**: quem instalou o hook de `Update-AllSkills.ps1` precisa remover o hook. O script não
   existe mais, e o hook falha. O `README.md` diz como.
2. **Bloco antigo do `.gitignore`** (`.agents/`, `.claude/skills/`, `.codex/skills/`, `skills-lock.json`): continua
   válido. Ele esconde as pastas inteiras, também as skills Locais. A pessoa pode remover o bloco: os links ficam
   escondidos pelo `.git/info/exclude`.
3. **`skills.yaml.sample`**: passa a mostrar `skills:` e `sources:` no formato novo.
4. **Publicação no npm** (`docs/cli-publicacao-e-operacao.md`): o documento sai. O passo `npm pack --dry-run` do
   CI e o `tests/package.test.mjs` saem com ele.

## Pontos de teste

Todos rodam a CLI como processo (`bin/colibri-skills.mjs`) num diretório temporário com `git init`, com um catálogo
de teste em `--catalog`.

1. `list --json` num projeto com `skills.yaml`: os estados em inglês. Sem `--json`: os textos em pt-BR.
2. `install --yes`: cria os 3 links de cada skill; `git status` do projeto não mostra os links; o clone não muda.
   **win32**: os links são junctions (`lstat` diz link, `readlink` aponta para o clone).
3. `install -b <bundle> --yes` num projeto sem `skills.yaml`: cria o arquivo com `core` e o bundle, e os links.
4. `install -s <skill> --yes` sem `--keep`: a skill fica `extra`. Com `--keep`: entra em `skills:`.
5. `remove -s <skill> --yes`: sai do `skills.yaml` e os links somem. A pasta da skill no clone continua.
6. Conversão: um projeto com `skills-lock.json` e cópias. A cópia igual é apagada, a cópia editada vai para o
   backup, o lock some.
7. Conflito: uma pasta real com o nome de uma skill do manifesto. `install` não muda a pasta e diz "conflito".
   `install --force -s` move a pasta para o backup.
8. `--dry-run`: a prévia aparece e nenhum arquivo muda.
9. Sem Git: erro em pt-BR e código de saída diferente de 0.
10. `catalog orphans`, `assign`, `unassign`, `bundle-delete`, `skill-delete`: o `bundles.yaml` muda linha a linha
    e os comentários ficam. `skill-delete` tira a entrada do `skill-requirements.yaml`.
11. `import`: com um repositório Git local como origem, a pasta aparece em `SKILLS/`.
12. `model-invocation`: cria `agents/openai.yaml` só nas skills com a flag.
13. Erros do motor: cada código (`not_in_clone`, `no_bundle`, ...) tem um texto em pt-BR, e o `--json` mantém o
    código.
14. Cópia do motor: o SHA-256 de `engine/link-skills.mjs` é o valor de `engine/ENGINE.json`.

O wizard (TTY) fica no `tests/wizard-pty.py`, que roda só em macOS e Linux.

### Roteiro manual no Windows

1. Num projeto com `skills.yaml`, rode `node <clone>\bin\colibri-skills.mjs install`.
2. Confira com `dir .claude\skills`: cada skill aparece como `<JUNCTION>`.
3. Edite um `SKILL.md` no clone e abra o mesmo arquivo pelo projeto: o texto é o novo.
4. Rode `git status` no projeto: os links não aparecem.
5. Rode `git clean -fdx` no projeto e depois `git status` no clone: o clone não mudou.

## Fora de escopo

- Projetos em outras máquinas: o mod faz isso pelo Herdr. A CLI roda na máquina do projeto.
- Fixar uma versão do catálogo por projeto. Todos os projetos veem o clone como ele está.
