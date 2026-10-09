---
name: commit
description: 'Cria commits no padrão conventional commits (título + descrição em bullets), tratando primeiro os submódulos com alterações pendentes e depois o repositório principal, e oferece remover do git os artefatos SDD (`tasks/prd-*/`) de features já concluídas. Use quando o usuário pedir para commitar, fazer commit, salvar alterações no git, gerar mensagem de commit, ou usar /commit. Só envia ao remoto quando o argumento `push`/`--push` for informado.'
argument-hint: '[--push|--enviar] [contexto opcional sobre o que foi feito]'
disable-model-invocation: true
---

# Commit (submódulos primeiro)

Commita as alterações pendentes: primeiro cada submódulo sujo, depois o repositório principal. Em repositórios com artefatos SDD, oferece também a remoção dos artefatos de features concluídas, num commit próprio.

Ligue o **modo push** sempre que a mensagem que invocou a skill contiver as palavras `push`, `--push`, `enviar` ou `--enviar` — seja como argumento de slash command (`/commit --push`), seja em texto livre ("commita e dá push", "pode enviar"). Não há substituição automática de variável: o texto digitado depois de `/commit` é só contexto anexado à mensagem, então basta ler a própria mensagem do usuário para decidir. Em modo push, depois de commitar, envia ao remoto (passo 8). Sem nenhuma dessas palavras, a skill para nos commits locais.

## Regras invioláveis

- Rede só no **modo push**, e só com `git push`, `git fetch` e `git pull --rebase` (nunca `git merge` nem pull com merge). Fora do modo push, nada de rede.
- **NUNCA** usar `--no-verify` ou `--no-gpg-sign`. Se um hook falhar, investigar e reportar, não contornar.
- Preferir commit novo a `--amend`.
- Não criar branch, não fazer checkout, não alterar o estado do working tree além do `git add` acordado e da remoção de artefatos SDD que o usuário escolher no passo 2.

## Procedimento

### 1. Levantar o estado

```bash
git submodule status
git status --porcelain
git symbolic-ref -q --short HEAD   # vazio/erro = HEAD destacado
```

Sem `.gitmodules`/submódulos, o passo 3 não se aplica: depois do passo 2, vá ao passo 6 (repositório principal).

### 2. Artefatos SDD concluídos

Rode uma vez, antes de qualquer commit, sobre todo repositório com pastas `tasks/prd-*/`: o principal e cada submódulo (`git -C <sub>`). Sem essas pastas em nenhum deles, pule.

Os artefatos SDD (PRD, TechSpec, `tasks.md`, tasks, handoffs, revisões, `checkpoint.json`, `workflow.md`, `snapshot-contexto.md`) são o contrato da feature enquanto ela está em andamento, e versioná-los nesse período é esperado. Concluída a feature, a fonte de verdade passa a ser o código, os testes e a documentação durável; os artefatos envelhecem a cada mudança posterior, e mantê-los no repositório convida agentes a tratá-los como especificação vigente ou a gastar esforço sincronizando-os. Por isso, a limpeza acontece aqui, no commit, e não durante a execução de outra feature.

Classifique cada `tasks/prd-[slug]/` pela primeira linha que decidir:

| Evidência | Classe |
|---|---|
| `checkpoint.json` com `status` ou `phase` igual a `concluido` | concluída |
| `snapshot-contexto.md` com `status: encerrado` e `etapa: aceite` | concluída |
| Sem `checkpoint.json`: nenhuma `task_*.md` na raiz da pasta, tasks em `done/`, e o `codereview_[maior num]/codereview.md` com status `APROVADO`, ou `APROVADO COM RESSALVAS` com a decisão do usuário sobre as ressalvas registrada, sem tasks de correção na raiz dessa revisão | concluída |
| `checkpoint.json` em outra fase, task pendente na raiz, última revisão `REPROVADO` ou correção pendente | em andamento |
| Qualquer outra combinação (ex.: só `prd.md`, recorte planejado ainda não iniciado, pasta só com snapshot, ressalvas sem decisão registrada) | indeterminada |

Feature em andamento nunca é oferecida. Para cada concluída ou indeterminada, levante antes de perguntar o que a remoção levaria embora sem registro em outro lugar:

- candidatas a ADR nos handoffs (`### Candidatas a ADR` com conteúdo diferente de `Nenhuma`), com ID e título;
- ressalvas aceitas e pendências registradas na última revisão ou em `workflow.md`;
- arquivos não versionados na pasta (`git status --porcelain -- tasks/prd-[slug]/`), que a remoção apaga sem volta.

Faça uma única pergunta para todos os repositórios, pela tool de perguntas disponível (`AskUserQuestion` em `multiSelect`) ou, sem ela, em texto com as mesmas opções. Uma opção por feature: repositório quando não for o principal, slug, classe com a evidência que a decidiu e, na descrição, os itens levantados acima. Indeterminada nunca vem marcada como recomendada. Quando houver candidata a ADR, recomende promovê-la antes e não remova a feature nesta execução se o usuário quiser promover. Com mais features do que cabem na ferramenta, pergunte em texto listando todas. Nenhuma seleção, "nenhuma" ou silêncio mantém tudo. Guarde a escolha para o passo 7; a pergunta acontece agora para que o resto da skill siga sem nova interrupção.

### 3. Para cada submódulo com alterações pendentes

Detectar sujeira em `<sub>` com `git -C <sub> status --porcelain`. Vazio = pular.

Para cada submódulo sujo, executar os passos 4 e 5 **dentro dele** (`git -C <sub> ...`) antes de tocar no principal.

### 4. Decidir o que entra no stage

Compare `git status --porcelain` (coluna 1 = staged, coluna 2 = working tree):

| Situação | Ação |
|---|---|
| Nada staged | `git add -A` direto, sem perguntar |
| Tudo já staged | Prossegue, sem perguntar |
| Único item fora do stage é o gitlink de um submódulo recém-commitado (resto já staged) | `git add <submódulo>` direto, sem perguntar |
| Parcialmente staged | Perguntar (ver abaixo) |

No caso parcial, use a tool de perguntas (`AskUserQuestion`) mostrando o que está staged e o que está de fora, com as opções:

- **Sim** — `git add -A` e commitar tudo
- **Não** — commitar apenas o que já está staged
- **Abortar** — encerrar sem commitar, para o usuário refazer o staging

### 5. Gerar a mensagem e commitar

**Use o contexto da sessão atual como fonte primária.** Se as alterações pendentes vieram do trabalho feito nesta conversa, você já sabe o *porquê* — o bug relatado, a decisão tomada, o ticket citado, a alternativa descartada. Isso vale mais que o diff: escreva a mensagem a partir desse contexto e use o diff só para conferir cobertura (nada relevante ficou de fora, nada alheio entrou junto). Se o diff contiver mudanças que **não** são da sessão, trate-as pelo diff normalmente.

Antes de escrever, leia o que vai ser commitado e o estilo do repositório:

```bash
git diff --staged --stat
git diff --staged
git log -8 --format="%s%n%b%n---"
```

Formato da mensagem (padrão GitHub / conventional commits):

```
tipo(escopo): resumo no imperativo, minúsculo, sem ponto final

- Alteração relevante 1
- Alteração relevante 2
- Alteração relevante 3
```

- Título ≤ 72 caracteres. Tipos: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`, `build`, `ci`, `style`.
- **Idioma e escopo seguem o `git log` do repositório em questão** — cada repo pode ter convenção própria; o submódulo pode diferir do principal.
- Bullets descrevem *o que mudou e por quê*, não arquivo por arquivo. Um commit trivial (ex.: bump de referência de submódulo) pode ter só o título.
- Sem trailer `Co-Authored-By`.

Commitar sem confirmação prévia. No PowerShell, use here-string literal (o `'@` de fechamento precisa estar na coluna 0):

```powershell
git commit -m @'
tipo(escopo): resumo

- Bullet 1
- Bullet 2
'@
```

No Bash, use heredoc equivalente (`git commit -F - <<'EOF'`).

### 6. Repositório principal

Depois dos submódulos, volte à raiz e repita os passos 4 e 5. O commit do submódulo deixa o gitlink modificado no principal, mas ele aparece como **não staged** (segunda coluna do `git status --porcelain`), mesmo que o resto já estivesse todo staged antes. Nesse caso, aplique a regra da tabela do passo 4: se o gitlink for a única mudança fora do stage, `git add <submódulo>` direto, sem perguntar, e prossiga para o commit. Se a **única** mudança do principal for o gitlink, use algo como `chore(lib): atualize referência do submódulo <nome>`.

### 7. Remover artefatos SDD escolhidos

Só quando o passo 2 teve feature escolhida, depois do commit normal do repositório que a contém. Num submódulo, faça a remoção logo depois do commit dele, antes de voltar ao principal, para que o gitlink já inclua a remoção. A remoção vai num commit próprio para manter o commit da feature limpo e deixar os artefatos recuperáveis pelo histórico a partir do commit anterior.

Para cada feature escolhida:

```bash
git -C <repo> rm -r -q tasks/prd-<slug>/
```

- Se o `git rm` recusar por alteração local (o usuário commitou só parte do stage no passo 4), pule essa feature e reporte; nada de `-f`.
- Arquivos não versionados que sobrarem na pasta foram avisados na pergunta: apague a pasta restante.
- Pasta sem nenhum arquivo versionado: só apague do disco.

Commite com título e idioma conforme o `git log`, e um bullet por feature citando o hash curto do último commit que ainda continha os artefatos (o `HEAD` antes deste commit), para recuperação com `git checkout <hash> -- tasks/prd-<slug>/`:

```
chore(sdd): remove artefatos de features concluídas

- prd-<slug>: artefatos até <hash curto>
```

Nunca ofereça nem remova `tasks/triagem-log.jsonl`: é log de calibração da triagem, não artefato de feature.

### 8. Push (só no modo push)

Envie **os submódulos primeiro, depois o principal** — o gitlink do principal só faz sentido no remoto se os commits do submódulo já estiverem lá.

Para cada repositório com commits à frente do remoto:

```bash
git -C <repo> push
```

- **Sem upstream** (`no upstream branch`): `git -C <repo> push -u origin <branch atual>`.
- **Rejeitado por não-fast-forward**: integre por rebase e tente de novo.

  ```bash
  git -C <repo> pull --rebase
  git -C <repo> push
  ```

- **Conflito no rebase**: resolva arquivo a arquivo preservando as duas intenções — a do commit remoto e a do commit local —, `git add` nos resolvidos e `git rebase --continue` até a fila esvaziar; então `push`. Se a resolução correta for ambígua (mesma linha mudada com propósitos incompatíveis, arquivo binário, conflito em migração/lockfile), execute `git -C <repo> rebase --abort`, deixe o repositório como estava e reporte o conflito para o usuário decidir — sem `--force`, sem `--skip`, sem `-X ours/theirs`.
- **Push rejeitado por outro motivo** (permissão, hook de servidor, branch protegida): reporte a saída e pare, sem contornar.

### 9. Reportar

Uma linha por commit criado: `<repo>: <hash curto> <título>`, incluindo o de remoção de artefatos SDD; features oferecidas e mantidas não precisam ser listadas. Depois, o destino de cada push (`<repo> → <remote>/<branch>`) ou, fora do modo push, uma linha dizendo que nada foi enviado ao remoto.

## Casos de borda

- **Nada a commitar em lugar nenhum**: informe e encerre, não force commit vazio. A remoção de artefatos escolhida no passo 2 ainda acontece e pode ser o único commit. No modo push, ainda faça o passo 8 se houver commits locais à frente do remoto.
- **Hook de pre-commit falhou**: reporte a saída, não tente contornar. Se o hook reformatou arquivos, re-stage e tente commitar de novo uma vez.
- **Merge/rebase em andamento** (`MERGE_HEAD`/`rebase-merge` presentes): pare e avise, não commite por cima.
- **HEAD destacado** (submódulo ou principal — `git -C <repo> symbolic-ref -q --short HEAD` vazio): **pare antes de commitar**. Avise que o commit ficaria órfão e deixe a decisão com o usuário. Só prossiga se ele informar a branch de destino; nesse caso a skill executa:

  ```bash
  git -C <repo> stash push -u -m "commit-skill"
  git -C <repo> checkout <branch>
  git -C <repo> stash pop
  ```

  Se o `stash pop` der conflito, pare e reporte — não tente resolver nem commitar. Sem branch informada, encerre sem commitar nada naquele repositório.
- **Mudanças heterogêneas** (várias features distintas no mesmo diff): faça commits separados por assunto usando `git add` por caminho, em vez de um commit genérico.
