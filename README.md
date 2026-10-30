# agents-instructions
A repository designed to store and organize instruction files for AI agents, categorized by language, model, and use case. Its goal is to standardize, reuse, and evolve prompts, system messages, and configuration files across different AI ecosystems.

## CLI multiplataforma (Node.js)

Requer Node.js **22.20 ou superior** e npm. O CLI usa `skills@1.7.4` como motor, sem exigir PowerShell ou fzf. Agentes desta primeira versão: Claude Code, Codex, Cursor, GitHub Copilot, OpenCode e Windsurf.

Confira a versão com `node --version` no terminal em que executará o CLI. Versões incompatíveis são bloqueadas antes de abrir o wizard ou executar comandos, com uma mensagem indicando a versão exigida e a detectada. O campo `engines` do npm sozinho pode apenas emitir um aviso durante a instalação. Se encontrar `fs/promises ... export named 'glob'` no Node 20, atualize o Node.js para uma versão compatível e execute novamente; essa API é usada pelo motor `skills`.

Para desenvolver e executar a partir do clone:

```sh
git clone https://github.com/ColibriAgile/agents-instructions.git
cd agents-instructions
npm ci --ignore-scripts
npm run build
npm start
```

Sem argumentos, abre o wizard: ação → escopo → agentes → bundles ou busca por skills → método → prévia e confirmação. Use as setas para navegar, digite para pesquisar, Tab para marcar, Enter para confirmar e Ctrl+C para cancelar. Cópia é o padrão; symlink usa uma cópia canônica persistente, com fallback do motor para cópia quando necessário.

Para abrir o wizard em outro projeto, em qualquer sistema:

```sh
node /caminho/do/clone/bin/colibri-skills.mjs --cwd /caminho/do/projeto
```

Use caminhos do seu sistema, entre aspas quando contiverem espaços. No Windows, por exemplo: `node "C:/Projetos/agents-instructions/bin/colibri-skills.mjs" --cwd "C:/Projetos/Meu Projeto"`.

O nome de pacote previsto é `@colibriagile/agents-instructions`, mas **ainda não foi publicado**. Após publicação, `npx @colibriagile/agents-instructions@latest` poderá abrir o wizard sem clone. Para testar o empacotamento localmente, use `npm pack`; o tarball inclui o catálogo e os recursos das skills.

### Comandos sem wizard

Os exemplos abaixo usam `node /caminho/do/clone/bin/colibri-skills.mjs` como executável. Após uma instalação via npm, o binário se chama `colibri-skills`.

```sh
# Catálogo, busca de nomes e instalações administradas por este CLI
node /caminho/do/clone/bin/colibri-skills.mjs list --available
node /caminho/do/clone/bin/colibri-skills.mjs list --json

# Ad hoc: somente a skill escolhida, sem alterar skills.yaml
node /caminho/do/clone/bin/colibri-skills.mjs install --skill commit --agent claude-code codex --yes

# Projeto: salva bundles em skills.yaml, inclui core e preserva fontes existentes
node /caminho/do/clone/bin/colibri-skills.mjs install --bundle dotnet code-review --agent claude-code --yes

# Reaplica o manifest já existente
node /caminho/do/clone/bin/colibri-skills.mjs install --agent claude-code --yes

# Instalação global e escolha do método
node /caminho/do/clone/bin/colibri-skills.mjs install --skill commit --agent claude-code codex --global --method symlink --yes

# Atualiza a partir do catálogo que acompanha a versão do CLI em execução
node /caminho/do/clone/bin/colibri-skills.mjs update --skill commit --yes

# Remove apenas os destinos escolhidos
node /caminho/do/clone/bin/colibri-skills.mjs remove --skill commit --agent claude-code --yes

# Reconciliação: lista extras administrados pelo CLI; remove só nomes explícitos
node /caminho/do/clone/bin/colibri-skills.mjs reconcile --json
node /caminho/do/clone/bin/colibri-skills.mjs reconcile --skill commit --yes

# Confira uma operação antes de executá-la
node /caminho/do/clone/bin/colibri-skills.mjs install --skill commit --agent claude-code --dry-run
```

`--cwd` escolhe o projeto; `--catalog` escolhe outro clone/catálogo local com `bundles.yaml` e `SKILLS/`. Alterações locais nas skills são utilizáveis imediatamente, sem commit, push ou `git pull`. Fontes externas declaradas no manifest podem exigir rede/Git. Não há download remoto das skills da Colibri durante uma instalação do catálogo empacotado.

### Estado, conflitos e compatibilidade

- O CLI registra propriedade e preferências em `.colibri-skills.json` no projeto ou `~/.colibri-agents/skills.json` no escopo global. Não confunda esse registro com o lock do motor. Inclua `.colibri-skills.json` no `.gitignore` do consumidor se as preferências forem individuais.
- `skills.yaml` continua sendo o manifest compartilhável do projeto. `skills` é uma lista opcional de nomes avulsos do catálogo, além de `bundles` e `sources`. Campos extras e comentários são preservados ao acrescentar bundles.
- No motor fixado, Codex, Cursor, Copilot e OpenCode compartilham `.agents/skills` no projeto e no home; não são quatro cópias independentes. O CLI mostra os destinos e exige selecionar todos os consumidores administrados quando uma operação afeta conteúdo compartilhado.
- Atualização/remoção trabalham com instalações registradas por este CLI. Instalações anteriores dos scripts PowerShell não são adotadas automaticamente. Para migrar, revise `install --dry-run` com o manifest/agentes desejados e depois use `install --force --yes` para assumir explicitamente os destinos existentes.
- Conteúdo manual, arquivos modificados e destinos não administrados são protegidos. `--force` permite substituir/remover esses conflitos explicitamente; `--yes` apenas confirma a operação, sem desativar a proteção. Diretórios de agente redirecionados por symlink exigem resolução manual.
- Em remoções parciais, o lock do motor é preservado enquanto outro destino ainda usa a skill. Uma cópia canônica usada para symlinks pode permanecer para proteger outros consumidores; os destinos selecionados são removidos. O CLI mantém a propriedade desse armazenamento para permitir reinstalação sem `--force`, mas não o lista como instalação ativa sem destinos registrados.
- Um arquivo `.lock` ao lado do estado impede duas operações simultâneas. Ctrl+C, SIGTERM ou SIGHUP durante uma operação encerram o motor, revertem a skill que estava sendo instalada ou atualizada, liberam o lock e saem com o código do sinal (130, 143 ou 129); basta repetir o comando, sem `--force`. Se o sinal chegar depois de todas as mudanças aplicadas e registradas, a operação termina normalmente, sai com 0 e avisa em stderr que o sinal chegou após a conclusão. Só um encerramento que não pode ser tratado (SIGKILL, queda do sistema ou de energia) deixa o lock para trás: confira que não há operação ativa antes de excluí-lo e tentar novamente; se a nova tentativa acusar `Unmanaged destination`, revise o destino parcial e use `--force` para substituí-lo.
- Atualizar o CLI e atualizar skills são operações distintas. Ao usar o pacote publicado, execute a versão desejada (`@latest` ou versão fixa) e depois `update`; ao usar um clone, as skills vêm desse clone.
- O instalador é multiplataforma; algumas skills exigem ferramentas específicas, como Delphi XE2/Windows, PowerShell, Python ou serviços internos. O CLI não converte esses requisitos. A pasta `INSTRUCTIONS/` continua no fluxo legado; esta versão instala skills.

Verificação: `npm run check`, `npm test` e `npm pack --dry-run`. Em macOS/Linux, `python3 tests/wizard-pty.py` também exercita o wizard em um terminal real. A CI define Windows, Linux e macOS com Node 22.20 e 24; resultados locais não substituem a execução dessa matriz.

Os scripts PowerShell abaixo continuam disponíveis para o fluxo legado.

### Requisitos de execução das skills

O wizard mostra avisos como **“Requer Windows e Delphi XE2”** ou **“Requer PowerShell 7”** durante a escolha das skills e na prévia anterior à confirmação. Bundles indicam quantas skills têm requisitos declarados e quantas apresentam restrição para o sistema atual. A prévia detalha cada skill, inclusive quando a seleção veio de bundles ou de `skills.yaml`.

Esses dados estão em `skill-requirements.yaml`, separado das instruções das skills e incluído no pacote npm:

```yaml
version: 1
skills:
  delphi-xe2-build:
    platforms: [win32]
    tools: [Delphi XE2]
    notes:
      - Também requer MSBuild .NET Framework 4 e as bibliotecas do projeto.
  assign-bundles:
    tools: [PowerShell 7]
```

Os identificadores de sistema aceitos são `win32` (Windows), `darwin` (macOS) e `linux`. `platforms`, `tools` e `notes` são listas opcionais; cada entrada precisa declarar ao menos uma lista não vazia. Nomes de skills inexistentes, versões desconhecidas do formato, campos inválidos e YAML incorreto são rejeitados. Catálogos antigos sem esse arquivo continuam funcionando.

A cobertura inicial inclui `delphi-xe2-build`, `assign-bundles`, `colibri-cis-testes` e `deep-review`. Skills sem entrada mostram **“Requisitos não catalogados”**; isso não significa compatibilidade com qualquer sistema. PowerShell 7 é o runtime de referência declarado para os fluxos `pwsh`, sem auditoria da versão mínima que cada script admite. Fontes externas não herdam requisitos de uma skill do catálogo que tenha o mesmo nome.

Nas instalações administradas, os avisos vêm do catálogo da versão do CLI em execução. Eles não são uma auditoria retroativa do conteúdo instalado, que pode pertencer a uma versão anterior.

O CLI compara somente a restrição de sistema operacional declarada com o sistema atual. **Não verifica binários, versões, serviços, licenças, credenciais ou permissões; não instala dependências nem executa os scripts da skill.** Estar em um sistema contemplado não garante que as ferramentas estejam disponíveis. Instalar em outro sistema permanece permitido, por exemplo para preparar um projeto que será usado em outra máquina; atualizações e remoções continuam disponíveis.

`list --available`, `list` e as prévias exibem os requisitos. Em JSON, cada skill inclui `requirements` (ou `null` quando desconhecido) e `runtime`, com `summary`, `platformStatus`, `notice` e `notes`. Os estados são `unknown` (sem entrada), `unspecified` (sistemas não declarados), `listed` (sistema contemplado) e `mismatch` (restrição para o sistema atual). Esses estados são informativos, não resultados de execução. Use `install --dry-run --json` para consultar a prévia sem alterações.

## Bundles de skills

`bundles.yaml` é o catálogo central de bundles por stack (`dotnet`, `delphi`, `frontend`) e por
temática (`sdd`, `code-review`, `jira-pm`, `authoring`), além do bundle `core`
(obrigatório em todo projeto).

Cada projeto declara os bundles que usa em um `skills.yaml` próprio (veja `skills.yaml.sample`),
commitado no repositório do projeto. `Install-Skills.ps1` resolve os bundles do manifesto,
instala as skills via `npx skills`, e reconcilia: detecta skills instaladas que não pertencem
ao manifesto (ex: bundle `authoring` instalado pontualmente e esquecido) e oferece removê-las.
Skills escritas à mão no próprio projeto (sem `sourceType` no `npx skills list --json`) nunca
entram na reconciliação.

### Projeto novo

Requer [`fzf`](https://github.com/junegunn/fzf) no PATH (`scoop install fzf` / `winget install fzf`).

```powershell
# Na raiz do projeto
pwsh <caminho-local-do-clone>\Init-Skills.ps1
```

Lista os bundles do `bundles.yaml` num picker fzf (multi-seleção com TAB; `core` sempre entra,
sem precisar escolher), grava o `skills.yaml` e garante o bloco no `.gitignore`. Rodar de novo
sobrescreve com confirmação, marcando `[já incluído]` nos bundles já presentes.

### Instalar/atualizar

```powershell
# Na raiz do projeto, com skills.yaml presente
pwsh <caminho-local-do-clone>\Install-Skills.ps1
```

Ao final, o resumo diz quais skills foram atualizadas (`~`) ou instaladas pela primeira vez (`+`)
e quantas ficaram sem mudança, comparando o `skills-lock.json` do projeto antes e depois. Skill
que você alterou aqui e aparece "sem mudança" não chegou ao projeto: confira se o push foi feito
e de qual branch as skills vieram.

Se `skills.yaml` não existir e a execução for interativa, `Install-Skills.ps1` chama o
`Init-Skills.ps1` automaticamente antes de instalar. Com `-Silent` (ex: hook de git) isso não
acontece — falha pedindo pra rodar o `Init-Skills.ps1` manualmente primeiro, já que o picker
fzf precisa de terminal interativo.

### Testar skills de uma branch

Com a cópia local numa branch já enviada ao remoto, `Install-Skills.ps1` instala as skills
de agents-instructions dessa branch (`owner/repo#branch` no `npx skills add`) e avisa que não
é a padrão; `-Ref <branch>` escolhe outra explicitamente. Para voltar, faça checkout da branch
padrão e rode o script de novo. `Update-AllSkills.ps1` fora da branch padrão exige
`-Ref <branch>`, para que a branch de teste não chegue a todos os projetos por engano.

### Atualizar todos os projetos de uma vez

Depois de mexer nas skills deste repositório, `Update-AllSkills.ps1` propaga para todos os
projetos sob uma pasta base — cada pasta com `skills.yaml` recebe um `Install-Skills.ps1`:

```powershell
pwsh <caminho-local-do-clone>\Update-AllSkills.ps1 -ListOnly   # confere o alcance antes
pwsh <caminho-local-do-clone>\Update-AllSkills.ps1
```

O padrão de `-Root` é a pasta que contém este clone. A sincronização do `bundles.yaml`
(git pull + checagem de push pendente) roda **uma vez**, não por projeto. Falha em um projeto
não interrompe os demais: o resumo final lista os que falharam com o comando para reproduzir,
e o script sai com código 1. Use `-Exclude '*\arquivados\*'` para pular caminhos e `-Silent`
para imprimir só o resumo.

Bundle extra pontual (ex: mexer no CLAUDE.md do projeto), sem alterar o `skills.yaml` commitado:

```powershell
npx skills add ColibriAgile/agents-instructions -s create-agent create-instructions writing-agents-md -y
```

Remova manualmente quando terminar, ou deixe para a próxima execução do `Install-Skills.ps1`
detectar e perguntar.

Para rodar a sincronização automaticamente a cada checkout/pull, adicione em
`.git/hooks/post-checkout` e `.git/hooks/post-merge` do projeto:

```sh
#!/bin/sh
pwsh <caminho-local-do-clone>/Install-Skills.ps1 -Silent
```

No `.gitignore` do projeto que consome `skills.yaml`, ignore os artefatos gerados pelo
`npx skills add` (reproduzíveis a qualquer momento, não são fonte de verdade):

```gitignore
.agents/
.claude/skills/
.codex/skills/
skills-lock.json
```

### Trazer skill de repositório externo

Para adicionar ao catálogo (`SKILLS/`) uma skill que já existe em outro repositório, em vez de
escrever do zero, use `Import-Skill.ps1`. Ele baixa em pasta temporária isolada e move só o
resultado para `SKILLS/`, sem deixar `.claude/skills`, `.agents` ou `skills-lock.json` sujos
neste repositório:

```powershell
pwsh Import-Skill.ps1 -Source vercel-labs/agent-skills -Skills deploy-to-vercel
```

Aceita várias skills do mesmo `Source` de uma vez (`-Skills a, b, c`) e `-Force` para
sobrescrever uma pasta já existente. Ao final, imprime o comando de
`SKILLS/assign-bundles/scripts/Set-SkillBundle.ps1` para cada skill baixada — rode-o em
seguida para colocá-la em um bundle de `bundles.yaml`.
