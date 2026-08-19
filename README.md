# agents-instructions
A repository designed to store and organize instruction files for AI agents, categorized by language, model, and use case. Its goal is to standardize, reuse, and evolve prompts, system messages, and configuration files across different AI ecosystems.

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

Se `skills.yaml` não existir e a execução for interativa, `Install-Skills.ps1` chama o
`Init-Skills.ps1` automaticamente antes de instalar. Com `-Silent` (ex: hook de git) isso não
acontece — falha pedindo pra rodar o `Init-Skills.ps1` manualmente primeiro, já que o picker
fzf precisa de terminal interativo.

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
`SKILLS/bundle-orphan-skills/scripts/Set-SkillBundle.ps1` para cada skill baixada — rode-o em
seguida para colocá-la em um bundle de `bundles.yaml`.
