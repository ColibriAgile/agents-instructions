# agents-instructions
A repository designed to store and organize instruction files for AI agents, categorized by language, model, and use case. Its goal is to standardize, reuse, and evolve prompts, system messages, and configuration files across different AI ecosystems.

## Skills como links para o clone

Este repositório é o **catálogo** de skills. O clone dele no seu computador é o único lugar com os arquivos das
skills. Cada projeto recebe **links** para o clone, não cópias:

- 1 link por skill em `.agents/skills`, `.claude/skills` e `.windsurf/skills` (junction de diretório no Windows,
  link simbólico no macOS e no Linux). Codex, Cursor, GitHub Copilot e OpenCode leem `.agents/skills`.
- Um `git pull` no clone atualiza todos os projetos de uma vez. Uma skill editada no clone aparece na hora nos
  projetos, também antes do commit.
- Os links não entram em commits: a ferramenta grava 1 linha por link no `.git/info/exclude` do projeto.

Existem 2 ferramentas, com as mesmas regras (o mesmo motor, `engine/link-skills.mjs`):

| Ferramenta | Para quem |
| --- | --- |
| Mod `skill-bundles` do [Herdr](https://github.com/dougcunha/herdr-mods/tree/main/skill-bundles-app) | Forma principal: um painel com o estado das skills do projeto focado. |
| CLI `colibri-skills` (este repositório) | Para quem não usa o Herdr: wizard e comandos de terminal. |

A decisão está no [ADR-002](docs/adr/002-skills-como-links-para-o-clone.md), e os detalhes na
[spec](docs/specs/links-para-o-clone.md).

## CLI `colibri-skills`

Requer Git e Node.js **22.20 ou superior**. Confira a versão com `node --version`. Uma versão incompatível é
bloqueada antes do wizard, com uma mensagem que diz a versão exigida e a detectada.

Prepare o clone 1 vez:

```sh
git clone https://github.com/ColibriAgile/agents-instructions.git
cd agents-instructions
npm ci --ignore-scripts
npm run build
```

Depois, na pasta de um projeto (um repositório Git):

```sh
node /caminho/do/clone/bin/colibri-skills.mjs
```

Sem argumentos, a CLI abre o wizard: vincular as skills do projeto, escolher os bundles, adicionar ou remover
skills avulsas, ver o estado, atualizar o clone e gerenciar o catálogo. Use as setas para navegar, digite para
pesquisar, Tab para marcar, Enter para confirmar e Ctrl+C para cancelar. Toda mudança mostra uma prévia e pede
confirmação.

Use caminhos do seu sistema, entre aspas quando tiverem espaços. No Windows, por exemplo:
`node "C:/Projetos/agents-instructions/bin/colibri-skills.mjs" --cwd "C:/Projetos/Meu Projeto"`.

### Comandos sem wizard

Os exemplos usam `colibri-skills` no lugar de `node /caminho/do/clone/bin/colibri-skills.mjs`.

```sh
# O estado das skills do projeto, e o catálogo
colibri-skills list
colibri-skills list --available

# Projeto novo: grava os bundles no skills.yaml (o core entra sempre) e cria os links
colibri-skills install --bundle dotnet code-review --yes

# Projeto que já tem skills.yaml (clone novo, worktree novo, depois de um git clean)
colibri-skills install --yes

# Troca os bundles do projeto pelos escolhidos e remove os links que sobram
colibri-skills install --bundle frontend --replace --yes

# Skill avulsa: só neste computador (extra), ou gravada em skills: do skills.yaml
colibri-skills install --skill commit --yes
colibri-skills install --skill commit --keep --yes

# Skill de outro repositório (entra em sources: com --keep)
colibri-skills install --skill deslop --repo someone/skills --keep --yes

# Tira skills avulsas do skills.yaml e remove os links
colibri-skills remove --skill commit --yes

# Atualiza o clone do catálogo e os clones de outros repositórios
colibri-skills update

# Confira uma operação antes de executá-la
colibri-skills install --bundle dotnet --dry-run
```

`--cwd` escolhe o projeto (a raiz Git da pasta). `--catalog` escolhe outro clone do catálogo. `--json` dá a saída
para máquinas, com os valores em inglês.

### Estados

| Na tela | `--json` | Quando |
| --- | --- | --- |
| vinculada | `linked` | Os 3 links existem e apontam para o clone. |
| faltando | `missing` | O `skills.yaml` pede a skill, mas falta um link. `install` cria. |
| cópia | `copy` | Uma instalação antiga (cópia). `install` troca por link. |
| sobrando | `stale` | Um link que o `skills.yaml` não pede mais. `install` remove. |
| conflito | `conflict` | O projeto tem uma pasta própria com o nome da skill. Só muda com `install --force -s <skill>`. |
| fora do clone | `absent` | O `skills.yaml` pede uma skill que o catálogo não tem. |
| extra | `extra` | Vinculada, mas fora do `skills.yaml`. |
| local | `local` | Uma skill escrita à mão no projeto. A ferramenta não toca (salvo `remove --force`). |
| sem clone | `unsupported` | Skill de outro repositório que não foi clonado. |

### O manifesto do projeto

Cada projeto declara o que usa num `skills.yaml`, com commit no repositório do projeto (veja `skills.yaml.sample`):

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

A CLI preserva os comentários e os campos extras do arquivo. As skills de outros repositórios são links para um
clone desse repositório, que a ferramenta mantém em `~/.config/herdr-app/cache/skill-bundles/sources/` (a mesma
pasta que o mod usa).

### Migração de instalações antigas

As versões anteriores instalavam cópias: os scripts PowerShell (`Install-Skills.ps1`) e a primeira versão desta
CLI. Para migrar um projeto, rode `colibri-skills install` nele 1 vez:

- Uma cópia sem mudanças é apagada e vira link.
- Uma cópia que você editou vai para `.agents/skills-backup/<skill>`. A saída diz quais foram.
- Uma pasta de skill que o Git rastreia é um **conflito**: só muda com `install --force -s <skill>`.
- O `skills-lock.json` e o `.colibri-skills.json` do projeto somem quando ficam vazios.
- Os links antigos em `.codex/skills` são removidos.

Confira também:

- **Hook de Git**: se o projeto tem `pwsh .../Install-Skills.ps1 -Silent` em `.git/hooks/post-checkout` ou
  `post-merge`, apague essas linhas. O script não existe mais. Com links, o hook não é necessário.
- **`.gitignore`**: o bloco antigo (`.agents/`, `.claude/skills/`, `.codex/skills/`, `skills-lock.json`) pode ficar.
  Ele também esconde as skills escritas à mão no projeto. Se você quer fazer commit de uma skill local, remova o
  bloco: os links continuam escondidos pelo `.git/info/exclude`.

### Requisitos de execução das skills

O wizard mostra avisos como **“Requer Windows e Delphi XE2”** durante a escolha das skills e na prévia anterior à confirmação. Bundles indicam quantas skills têm requisitos declarados e quantas apresentam restrição para o sistema atual. A prévia detalha cada skill, inclusive quando a seleção veio de bundles ou de `skills.yaml`.

Esses dados estão em `skill-requirements.yaml`, separado das instruções das skills:

```yaml
version: 1
skills:
  delphi-xe2-build:
    platforms: [win32]
    tools: [Delphi XE2]
    notes:
      - Também requer MSBuild .NET Framework 4 e as bibliotecas do projeto.
  assign-bundles:
    tools: [Node.js]
```

Os identificadores de sistema aceitos são `win32` (Windows), `darwin` (macOS) e `linux`. `platforms`, `tools` e `notes` são listas opcionais; cada entrada precisa declarar ao menos uma lista não vazia. Versões desconhecidas do formato, campos inválidos e YAML incorreto são rejeitados. Uma entrada de uma skill que não existe mais gera só um aviso. Catálogos antigos sem esse arquivo continuam funcionando.

A cobertura inicial inclui `delphi-xe2-build`, `assign-bundles`, `colibri-cis-testes` e `deep-review`. Skills sem entrada mostram **“Requisitos não catalogados”**; isso não significa compatibilidade com qualquer sistema. PowerShell 7 é o runtime de referência declarado para os fluxos `pwsh`, sem auditoria da versão mínima que cada script admite. Fontes externas não herdam requisitos de uma skill do catálogo que tenha o mesmo nome.

O CLI compara somente a restrição de sistema operacional declarada com o sistema atual. **Não verifica binários, versões, serviços, licenças, credenciais ou permissões; não instala dependências nem executa os scripts da skill.** Estar em um sistema contemplado não garante que as ferramentas estejam disponíveis. Vincular em outro sistema permanece permitido, por exemplo para preparar um projeto que será usado em outra máquina.

`list --available`, `list` e as prévias exibem os requisitos. No JSON de `list`, cada skill inclui `requirements` (ou `null` quando desconhecido) e `runtime`, com `summary`, `platformStatus`, `notice` e `notes`. Os estados são `unknown` (sem entrada), `unspecified` (sistemas não declarados), `listed` (sistema contemplado) e `mismatch` (restrição para o sistema atual). Esses estados são informativos, não resultados de execução. Use `install --dry-run` para consultar a prévia sem alterações.

## Gerenciar o catálogo

Os comandos abaixo mudam o clone (`bundles.yaml` e `SKILLS/`) e **não fazem commit**. Revise com `git diff`, faça
commit e push. O wizard tem as mesmas ações em "Gerenciar o catálogo", e o mod do Herdr tem o botão **Catalog**.

`bundles.yaml` é o catálogo de bundles por stack (`dotnet`, `delphi`, `frontend`) e por tema (`sdd`,
`code-review`, `authoring`), além do `core`, que entra em todo projeto.

```sh
# Skills que não estão em nenhum bundle
colibri-skills catalog orphans

# Põe skills num bundle; --description cria o bundle quando ele não existe
colibri-skills catalog assign -s minha-skill -b dotnet --yes
colibri-skills catalog assign -s minha-skill -b dados --description "Dados: SQL e relatórios." --yes

# Tira skills de um bundle
colibri-skills catalog unassign -s minha-skill -b dotnet --yes

# Apaga um bundle (as pastas das skills ficam; o core nunca sai)
colibri-skills catalog bundle-delete -b dados --yes

# Apaga a pasta de uma skill e tira a skill de todos os bundles e do skill-requirements.yaml
colibri-skills catalog skill-delete -s minha-skill --yes
```

### Trazer uma skill de um repositório externo

```sh
colibri-skills import vercel-labs/agent-skills -s deploy-to-vercel --yes
```

A CLI clona o repositório no cache, copia a pasta da skill para `SKILLS/` (sem o `.git`) e diz o comando
`catalog assign` para pôr a skill num bundle. `--force` substitui uma skill que já existe.

### Skills que o modelo não deve invocar sozinho

```sh
colibri-skills model-invocation
```

Cria `agents/openai.yaml` (com `allow_implicit_invocation: false`) em cada skill cujo `SKILL.md` tem
`disable-model-invocation: true`.

## Desenvolvimento da CLI

- Regras: [`.claude/rules/cli.md`](.claude/rules/cli.md) (texto de tela em pt-BR, testes como processo, spec antes de implementar).
- Verificação: `npm run check` e `npm test`. Em macOS e Linux, `python3 tests/wizard-pty.py` exercita o wizard num
  terminal real. O CI roda Windows, Linux e macOS com Node 22.20 e 24.
- **Motor**: `engine/link-skills.mjs` é uma cópia do arquivo do repositório
  [herdr-mods](https://github.com/dougcunha/herdr-mods). Não edite a cópia. Mude o arquivo lá e rode
  `npm run engine:sync -- <pasta do clone do herdr-mods>`. O teste `tests/engine.test.mjs` confere o hash.
- O `link.bat` cria junctions de `INSTRUCTIONS` e `AGENTS`. Ele não gerencia skills.
