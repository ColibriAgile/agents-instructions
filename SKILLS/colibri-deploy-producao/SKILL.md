---
name: colibri-deploy-producao
description: 'Liberação para produção dos pacotes Colibri a partir de tarefas do Jira: lê as chaves (por exemplo WIN-3159), confere versões, dependências do manifesto.server, master e branches pendentes. A partir de um branch de fix ou feature, integra o branch no master por PR, faz checkout do master e remove o branch. Ajusta o versao.ini quando a versão do Jira é maior. Abre e mescla os PR master -> production, aguarda os builds, dispara os deploys, publica no market-place com nota de release (opcional), lança as fixVersions e comenta nas tarefas. Use sempre que o usuário pedir para liberar, publicar, subir ou fazer deploy em produção de pacotes, de uma tarefa do Jira ou do branch atual, ou pedir os PR para o branch production, mesmo sem dizer "deploy". Não use para pacotes de QA, releases de branches de teste, deploy do Catálogo cloud (imagem e Argo) nem para alterar workflows sem uma liberação.'
argument-hint: 'Informe uma ou mais chaves de tarefa do Jira (por exemplo: WIN-3159 WIN-3160). Sem chave, a skill usa a chave do nome do branch atual.'
---

# Liberação para produção

Esta skill leva para produção os pacotes que uma ou mais tarefas do Jira entregam. O fluxo tem ações difíceis de desfazer: merge no `master` e em `production*`, remoção de branch e envio de pacotes ao S3, que chegam às lojas. O pedido do usuário autoriza essas ações para os pacotes das tarefas. Pare e pergunte ao usuário em cada ponto de decisão marcado com **Pergunte**, porque a resposta depende de regra de negócio ou de risco que o código não mostra.

Antes de começar, leia [references/pipeline-colibri.md](./references/pipeline-colibri.md). Ela explica a versão do pacote, as dependências do manifesto, o mapa de repositórios, o build, o deploy e os problemas conhecidos.

## Ferramentas

- `gh` autenticado na organização `ColibriAgile`.
- `git` no repositório local, quando o pedido parte de um branch de fix ou feature.
- MCP do Atlassian: `getAccessibleAtlassianResources`, `getJiraIssue`, `searchJiraIssuesUsingJql`, `editJiraIssue` e `addOrEditJiraIssueComment`. As operações de versão vêm do `discover`: `getJiraProjectVersions` (com `executeRead`) e `manageJiraProjectVersion` (com `executeDestructive`). Chame o `discover` uma vez antes de usar essas operações.
- Scripts desta skill. Nesta skill, `scripts/` quer dizer `<pasta base da skill>/scripts/`: o harness mostra a pasta base quando carrega a skill. Use caminho absoluto nos comandos. Use uma pasta temporária só como pasta de trabalho, para clones e arquivos de saída.

| Script | Uso |
|---|---|
| `jira-resumo.py <arquivo.json>...` | Resume a tarefa salva pelo `getJiraIssue` (fixVersions, descrição, comentários com tabelas). |
| `estado-repo.py <repo>...` | Mostra, só com leitura, versões, dependências, workflows, execuções do master, PR abertos, releases e hotfixes não portados. |
| `aguardar-builds.sh <T0> <repo>:<wf>:<branch>...` | Acompanha os builds disparados pelo merge. Use com a ferramenta Monitor. |
| `aguardar-execucoes.sh <repo>:<runId>...` | Acompanha execuções pelo id (deploy, reexecução). Use com a ferramenta Monitor. |
| `conferir-deploy.sh <repo>:<runId>...` | Mostra a tag, o `.cmpkg` enviado e a contagem `Enviados/Ignorados`. |
| `publicar-market.py consultar <Nome>:<versão>...` | Mostra, só com leitura, o id do pacote no market-place, se ele está publicado e se tem nota. |
| `publicar-market.py publicar <notas.json> [--simular]` | Publica os pacotes pendentes com as notas, com o token de `COLIBRI_MARKET_TOKEN`, e confere o resultado. |

## Lista de tarefas

Antes do passo 0, crie a lista de tarefas da sessão com estes itens. O número de cada item é o número do passo. Atualize cada item quando ele terminar. Se o passo 0 não acha um branch de origem, marque o item 3 como cancelado. Se o passo 8 tira a publicação no market-place, marque o item 13 como cancelado.

0. Identificar o ponto de partida (branch de origem ou master)
1. Ler as tarefas do Jira e listar os pacotes e as versões
2. Mapear cada pacote ao repositório e ao build
3. Integrar o branch de origem no master e remover o branch
4. Separar os pacotes já liberados dos pacotes a liberar
5. Conferir as dependências do `manifesto.server`
6. Conferir o estado do master (builds e testes)
7. Conferir os branches relacionados e os hotfixes não portados
8. Conferir as versões do Jira e as tarefas pendentes nelas
9. Criar os PR para os branches de produção
10. Fazer o merge dos PR
11. Aguardar os builds e conferir as versões geradas
12. Disparar os deploys na ordem das dependências e aguardar
13. Publicar os pacotes no market-place (opcional)
14. Lançar as versões do Jira
15. Gerar o relatório e comentar em cada tarefa

## Passo 0: Identificar o ponto de partida

O usuário pode pedir a liberação de 2 lugares. O fluxo muda um pouco em cada caso.

- **Modo master:** o pedido vem só com as chaves do Jira, ou o repositório local está no `master`, num `production*` ou fora de um repositório Colibri. O código já está no master. Pule o passo 3.
- **Modo branch:** o repositório local está num branch de fix ou de feature (por exemplo `fix/WIN-3159-troco`, `feature/WIN-3160`). O código desse branch ainda não está no master. O passo 3 integra o branch no master antes do PR para a produção.

1. No diretório de trabalho, rode `git rev-parse --abbrev-ref HEAD` e `gh repo view --json name,owner --jq '.owner.login + "/" + .name'`.
2. Se o branch atual não é `master` nem `production*` e o repositório é da `ColibriAgile`, o branch é candidato ao modo branch. Guarde o nome do branch e o repositório.
3. Se o usuário não deu a chave do Jira, tire a chave do nome do branch. Prefira o prefixo do projeto (`WIN-<número>`); o padrão genérico `[A-Z]+-[0-9]+` também pega textos como `UTF-8`. O passo 1 confirma a chave com o `getJiraIssue`. Se o nome não tem chave ou a chave não existe no Jira, **Pergunte** a chave.
4. Se o usuário deu chaves e o branch tem outra chave, **Pergunte** se o branch atual faz parte da liberação. Se o branch não tem chave e o repositório não gera nenhum pacote das tarefas (passo 2), use o modo master: o branch não tem relação com a liberação.
5. No modo branch, confira o repositório local:
   - `git status --porcelain` vazio. Se há mudanças sem commit, **Pergunte**. Não faça `stash` nem commit por conta própria: as mudanças podem estar fora do que o QA testou.
   - Rode `git fetch origin` e `git ls-remote --exit-code --heads origin <branch>`. Se o branch não existe no remoto (código de saída 2), o branch nunca foi enviado: **Pergunte** se faz `git push -u origin HEAD`.
   - Se o branch existe no remoto, rode `git rev-list --left-right --count origin/<branch>...HEAD`. O número da direita é a quantidade de commits locais sem push: se ele é maior que 0, **Pergunte** se faz o push. O número da esquerda é a quantidade de commits do remoto que o local não tem: faça `git pull --ff-only origin <branch>`.

**Saída:** modo (branch ou master), repositório, branch de origem e chaves.

## Passo 1: Ler as tarefas

1. Obtenha o `cloudId` com `getAccessibleAtlassianResources`.
2. Para cada chave, chame `getJiraIssue` com `view: "full"`. O resultado passa do limite e o harness o salva em arquivo. Rode `python -I scripts/jira-resumo.py <arquivos>`.
3. Monte a lista de pacotes:
   - `fixVersions` dá os pacotes e a versão curta (por exemplo `POS 11.2`).
   - As tabelas dos comentários ("Pacotes para o QA", "Pacotes para baixar") dão a versão completa e o branch do build do QA. Para cada pacote, use a versão do comentário mais recente.
   - Um pacote só em `fixVersions`, sem versão completa, entra com a versão curta. Registre isso.
4. Junte as tarefas. Se 2 tarefas pedem o mesmo pacote com os 3 primeiros números diferentes, **Pergunte** qual versão vale.
5. Separe os itens "fora dos pacotes" (scripts do cloud, Catálogo cloud, configuração manual). Eles vão para o relatório como pendências.
6. Confira se o QA aprovou cada tarefa (status e últimos comentários). Se uma tarefa não tem aprovação, **Pergunte** se ela entra. No modo branch, essa resposta vem antes do merge no master: sem aprovação, o branch não entra no master.

**Saída:** tabela com pacote, versão esperada, branch do build do QA e tarefa de origem. A versão esperada é a versão da fixVersion. Se a tabela do QA tem uma versão completa com os mesmos números iniciais, use os 3 primeiros números dela.

## Passo 2: Mapear os repositórios

1. Use o mapa da referência para achar o repositório de cada pacote. Para um pacote fora do mapa, procure o `nome` do manifesto: `gh search code '"nome": "<Nome>"' --owner ColibriAgile --filename manifesto.server`. Se a busca falhar ou não achar nada, **Pergunte** o repositório ao usuário.
2. Rode `python -I scripts/estado-repo.py <repo1> <repo2> ...` com todos os repositórios. O script leva cerca de 20 segundos por repositório: use timeout de 600000 ms ou `run_in_background`. Guarde a saída: os passos 4 a 8 usam essa saída. No modo branch, o passo 3 roda o script de novo para o repositório de origem.
3. Para cada pacote, anote:
   - o `versao.ini` e o branch de produção que dispara o build (gatilho `push` do workflow);
   - o workflow de build;
   - o deploy: a entrada `tag_prefix` e se o `deploy.yml` repassa o `tag-prefix` para a action.

**Saída:** para cada pacote, repositório, `versao.ini`, branch de produção, workflow de build e forma de deploy.

## Passo 3: Integrar o branch de origem no master

Só no modo branch. O objetivo é colocar no master o código que o QA aprovou, com a versão certa, e deixar o repositório local limpo no master. Os passos seguintes usam só o master.

O merge no master exige só 2 condições: a aprovação do QA (passo 1, item 6) e a versão conferida (3.1). Os passos 5, 7 e 8 vêm depois do merge. Um problema nesses passos (dependência, hotfix, versão do Jira com pendência) para só o PR para a produção. O merge no master fica, porque o código aprovado pelo QA pertence ao master. Diga isso ao usuário em 1 frase antes do merge.

### 3.1 Conferir a versão do branch

Para cada pacote da liberação que o repositório de origem gera, leia o `versao.ini` local que o passo 2 ligou ao pacote. Um repositório com vários builds tem 1 `versao.ini` por pacote (por exemplo, `.build/app/` e `.build/scripts/`). Compare os números da versão esperada (passo 1) com os mesmos números do `versao.ini`. Uma versão curta com 2 números (`POS 11.2`) compara só os 2 primeiros: o `Release` do `versao.ini` fica como está.

- **Iguais:** siga.
- **Jira maior que o branch** (por exemplo, Jira `POS 11.2.1` e `versao.ini` `11.2.0`): ofereça o ajuste. **Pergunte** com as opções "Ajustar o `versao.ini` para `<X.Y.Z>`" e "Não ajustar e tirar este pacote da liberação". Mostre a versão do Jira, a versão do branch e o caminho do `versao.ini`. Com uma versão curta de 2 números maior que o branch (Jira `POS 11.3`, `versao.ini` `11.2.4`), sugira `<X.Y>.0`.
- **Jira menor que o branch:** não ajuste. **Pergunte** se a fixVersion da tarefa está errada ou se o branch tem uma versão nova de propósito.

Se o usuário tira um pacote da liberação, **Pergunte** se o merge do branch no master continua. O branch pode gerar outros pacotes da liberação.

Para fazer o ajuste aprovado:

1. Edite só os valores `MajorVersion`, `MinorVersion` e `Release` da seção `[versaoinfo]`. Use a ferramenta Edit para manter a codificação e o fim de linha do arquivo.
2. Rode `git add -- <caminho do versao.ini>`.
3. Faça o commit no branch de origem: `git commit -m 'chore(versao): <Pacote> <X.Y.Z> (<CHAVE>)'`. Use aspas simples: no PowerShell, aspas duplas expandem `$` e crases.
4. Rode `git push -u origin HEAD`.
5. Registre o ajuste para o relatório. O commit muda só a versão, mas é um commit que o QA não testou.

O ajuste fica no branch, antes do merge, para que o master receba o código e a versão no mesmo merge.

### 3.2 Fazer o merge no master

1. Procure um PR aberto do branch: `gh pr list -R ColibriAgile/<repo> --head <branch> --base master --state open --json number,url`. Se ele existe, use esse PR.
2. Se não existe, crie: `gh pr create -R ColibriAgile/<repo> --base master --head <branch> --title "<CHAVE>: <resumo da tarefa>" --body "<corpo>"`. O corpo cita a tarefa com o link e termina com as linhas de atribuição que a sessão pede.
3. Confira o PR com `gh pr view <n> -R ColibriAgile/<repo> --json mergeable,mergeStateStatus` (repita enquanto o valor for `UNKNOWN`):
   - `CLEAN`: siga.
   - `UNSTABLE`: veja `gh pr checks`. Falha do runner: execute de novo e aguarde. Quality gate do SonarCloud: siga e registre. Falha real de teste: **Pergunte**.
   - `BEHIND` ou `CONFLICTING`: o branch não tem os commits novos do master. **Pergunte** se atualiza o branch com `git merge origin/master`. Não resolva um conflito por conta própria.
   - `BLOCKED`: o master exige revisão ou outra regra de proteção. Pare e **Pergunte**. Use `gh pr merge --admin` só com a autorização explícita do usuário.
4. Faça o merge com commit de merge: `gh pr merge <n> -R ColibriAgile/<repo> --merge`. Não passe `--delete-branch`: o item 3.3 remove o branch com conferência. Não use squash nem rebase: o passo 7 (item 3) procura o commit do build do QA no master, e o squash cria outro commit.
5. Confira `state=MERGED` com `gh pr view <n> -R ColibriAgile/<repo> --json state,mergeCommit`.

### 3.3 Voltar ao master e remover o branch

Faça estas ações logo depois do merge:

1. `git checkout master`. Se o comando falha (arquivo local em conflito, `master` local ausente), pare e mostre o erro ao usuário. Não use `-f`.
2. `git pull --ff-only origin master`
3. Remova o branch local: `git branch -d <branch>`. Use `-d`, não `-D`: o `-d` recusa remover um branch com commits fora do master. Se ele recusa, mostre `git log master..<branch> --oneline`, **Pergunte** e não faça o item 4.
4. Remova o branch remoto: `git push origin --delete <branch>`. Se o GitHub já removeu o branch no merge (configuração do repositório), o comando mostra `remote ref does not exist`. Isso está certo.
5. Rode `git fetch --prune`.
6. Rode `python -I scripts/estado-repo.py <repo>` de novo para o repositório de origem. Os passos 4 a 8 usam essa saída nova.

O merge no master dispara os builds e testes do master. O passo 6 aguarda essas execuções antes do PR para a produção.

**Saída:** PR do branch com merge, ajuste de versão (se houve), repositório local no master e branch removido do local e do remoto.

## Passo 4: Separar já liberados e a liberar

Compare só os 3 primeiros números. O 4º número é o número da execução do workflow e sempre muda (veja a referência).

Para cada pacote:

1. **A liberar:** o `versao.ini` do master tem a versão esperada, e o master tem commits que o branch de produção não tem.
2. **Já liberado:** o branch de produção já tem a versão esperada, o master não tem commits novos para esse build, e existe release com essa versão. Confira se o deploy desse release já rodou: procure a execução do `deploy.yml` depois da data do release e confira o pacote com `conferir-deploy.sh`. Se o release existe sem deploy, o pacote volta para a lista de deploy (sem PR).
3. **Versão do Jira maior que o master:** o master e a produção têm uma versão menor que a versão esperada. Antes de oferecer o ajuste, confira se um branch relacionado sem merge tem a versão esperada (passo 7, itens 1 e 2). Nesse caso, a causa é o merge que falta, não o `versao.ini`. Se não há esse branch, ofereça o ajuste: **Pergunte** com as opções "Ajustar o `versao.ini` para `<X.Y.Z>`" e "Não liberar este pacote". Para ajustar, crie o branch `chore/versao-<pacote>-<X.Y.Z>` a partir do master, faça o commit do passo 3.1, abra o PR para o master, faça o merge com `--merge` e remova o branch. Depois, o pacote fica na lista "a liberar".
4. **Outra versão diferente:** o master ou a produção tem uma versão maior que a versão esperada. Não abra PR nem faça deploy desse pacote. Avise o usuário logo, com a versão esperada, a versão encontrada e quem liberou (PR, autor, data).

Avise o usuário em 1 frase, uma vez, que a comparação usa só os 3 primeiros números.

**Saída:** 3 listas: a liberar, já liberado (com ou sem deploy) e versão diferente.

## Passo 5: Conferir as dependências

Leia as dependências na saída do `estado-repo.py` (`manifesto.server` do master). O padrão é versão mínima (veja a referência).

1. Para cada pacote a liberar e cada dependência:
   - Se o pacote exigido está na lista de deploy, a versão dele tem de atender o padrão.
   - Se o pacote exigido não está na lista, ele tem de estar liberado em produção com versão que atende o padrão. Confira o último release de produção do repositório dele.
2. Dependências de infraestrutura (`Master`, `Guard`, `Launcher`, `DotnetCore`, `Sync`, `PGSql`, `Plugin_*`, `Binarios`, `Reports`, `NotaFiscal`) mudam pouco. Confira só as que o `estado-repo.py` marca com `<- mudou`.
3. Se uma dependência não está atendida, não faça deploy do pacote. **Pergunte** ao usuário: incluir o pacote exigido na liberação ou tirar o pacote dependente.
4. Monte a ordem do deploy: um pacote vai depois de todos os pacotes que ele exige. Em geral, os scripts vão antes das aplicações.

**Saída:** dependências conferidas e ordem do deploy.

## Passo 6: Conferir o estado do master

Na saída do `estado-repo.py`, confira a última execução de cada workflow de build e de testes no master de cada repositório a liberar. No modo branch, use as execuções que o merge do passo 3 disparou.

- `success`: siga.
- Falha: leia o log com `gh run view <id> -R ColibriAgile/<repo> --log-failed`.
  - Falha do runner (por exemplo `MSB4166`, `SDK Resolver Failure`, rede): execute de novo com `gh run rerun <id> -R ColibriAgile/<repo> --failed` e aguarde.
  - Falha real de build ou de teste: não libere esse repositório. **Pergunte** ao usuário.
- `in_progress` ou `queued`: aguarde a conclusão antes do PR.

**Saída:** master sem falha em todos os repositórios a liberar.

## Passo 7: Conferir os branches

O objetivo é garantir que o master tem tudo o que o QA testou e que o merge não vai desfazer um hotfix de produção.

1. **Branches relacionados:** branches com a chave da tarefa no nome (`gh api repos/ColibriAgile/<repo>/branches --paginate --jq '.[].name | select(test("<chave>"; "i"))'`), branches citados nas tabelas do QA (coluna Branch) e PR abertos que citam a chave (`gh pr list -R ColibriAgile/<repo> --search <chave> --state open`). Ignore os branches sem relação com as tarefas. No modo branch, o branch de origem já foi removido no passo 3.
2. Para cada branch relacionado que ainda existe, confira `gh api repos/ColibriAgile/<repo>/compare/master...<branch> --jq .ahead_by`. Um valor maior que 0 quer dizer commits sem merge no master. **Pergunte** ao usuário antes de seguir com esse repositório.
3. **Build do QA:** procure a execução do QA pelo número (o 4º número da versão do QA) com `gh run list -R ColibriAgile/<repo> --workflow <wf> --limit 200 --json number,headSha,headBranch`. Confira que o commit dela está no master (`compare/<sha>...master` com `behind_by` igual a 0). Liste os commits que o master tem a mais: eles vão para produção sem o teste do QA e entram no relatório.
4. **Hotfixes não portados:** o `estado-repo.py` lista os commits que estão só no branch de produção. Um hotfix que não está no master causa conflito no PR ou volta o código de produção para trás. Confira o conteúdo no master (um cherry-pick já feito também aparece na lista). Se falta o hotfix, mostre ao usuário o trecho de produção e o trecho do master e **Pergunte** se faz cherry-pick do hotfix no master.

**Saída:** branches relacionados sem commits pendentes, commits extras por repositório e hotfixes resolvidos.

## Passo 8: Conferir as versões do Jira

O passo 14 lança as versões do Jira (fixVersions) das tarefas. Uma versão lançada tem de conter só tarefas concluídas. Confira as versões antes dos PR, porque a decisão do usuário pode parar a liberação.

1. Liste as fixVersions de todas as tarefas: id, nome e `released`. Ligue cada versão a um pacote da liberação. O nome da versão usa a versão curta do pacote (por exemplo, `PIS 1.6` para o PIS 1.6.1).
2. Leia o nome atual de cada versão com `getJiraProjectVersions` (`versionId`). Outra pessoa pode renomear uma versão depois que a tarefa a recebe. Exemplo: a versão da tarefa era "CBO Connect 1.9.4" e passou a "CBO Connect 2.0", com outro escopo. Se o nome não corresponde mais ao pacote, **Pergunte**: criar uma versão com o nome certo e trocar a fixVersion das tarefas liberadas, ou não mexer.
3. Procure as tarefas pendentes com `searchJiraIssuesUsingJql`: `fixVersion in (<ids>) AND statusCategory != Done`, com `fields: ["fixVersions", "status", "summary"]` e `view: "full"` (sem `view: "full"`, as fixVersions não aparecem).
4. Para cada versão com tarefa pendente, liste as versões abertas do mesmo produto com `getJiraProjectVersions`: `projectIdOrKey`, `query` com o nome do produto (por exemplo `CBO`) e `status: ["unreleased"]`. Tire da lista a própria versão e as versões de outro produto com nome parecido (`CBO Connect`, `CBO Scripts` e `CBO Reports` não são `CBO`).
5. **Pergunte** (HIL) para cada versão com pendência. Mostre as tarefas pendentes (chave, resumo e status) e dê estas opções:
   - **Abortar:** parar a liberação antes dos PR.
   - **Mover para uma versão aberta:** 1 opção para cada versão aberta do item 4, da menor para a maior.
   - **Criar uma versão nova:** peça o nome da versão. Sugira a próxima versão de patch (por exemplo, `CBO 2.10.5` para a `CBO 2.10.4`).

   A `AskUserQuestion` aceita até 4 opções por pergunta. Use "Abortar", as 2 menores versões abertas e "Criar `<nome sugerido>`". O usuário escreve outro nome de versão nova ou outra versão aberta em "Other". Cite na pergunta as versões abertas que ficaram fora das opções.
6. Registre a decisão de cada versão. Não mova nem crie nada agora: o passo 14 faz as mudanças depois do deploy. Assim, uma liberação que para no meio não deixa o Jira com versões lançadas sem pacote em produção.

No modo branch, "Abortar" para só a liberação para a produção. O merge no master do passo 3 fica: o código aprovado pelo QA pertence ao master.

7. **Market-place:** se a variável de ambiente `COLIBRI_MARKET_TOKEN` existe, inclua nas perguntas deste passo: "Publicar os pacotes no market-place depois do deploy?". Não mostre o valor da variável; confira só se ela existe (`[bool]$env:COLIBRI_MARKET_TOKEN` no PowerShell, `test -n "$COLIBRI_MARKET_TOKEN"` no Bash). Se a variável não existe, não pergunte: registre que o passo 13 ficou fora e diga isso ao usuário em 1 frase.

**Saída:** para cada versão, a ação do passo 14: lançar, lançar e mover as pendentes para uma versão (existente ou nova), ou criar a versão certa no lugar de uma versão renomeada. Também a decisão do passo 13: publicar no market-place ou não.

## Passo 9: Criar os PR

Crie 1 PR por repositório e branch de produção que tem pacote a liberar. Um repositório pode precisar de 2 PR (por exemplo, `production` para a aplicação e `production-scripts` para os scripts).

```bash
gh pr create -R ColibriAgile/<repo> --base <branch-de-producao> --head master \
  --title "Versão <M.m.r>: <Pacote> (<CHAVES>)" \
  --body "<corpo>"
```

O corpo diz o pacote, a versão, as tarefas (com link `https://colibri.atlassian.net/browse/<CHAVE>`) e a data da aprovação do QA. Termine o corpo com as linhas de atribuição que a sessão pede.

Depois de criar, confira cada PR com `gh pr view <n> -R ColibriAgile/<repo> --json mergeable,mergeStateStatus` (repita enquanto o valor for `UNKNOWN`):

- `MERGEABLE CLEAN`: siga.
- `MERGEABLE UNSTABLE`: veja `gh pr checks`. Teste com falha do runner: execute de novo e aguarde. Quality gate do SonarCloud: siga e registre no relatório. Falha real de teste: **Pergunte**.
- `CONFLICTING`: simule o merge num clone temporário (`git merge --no-commit --no-ff origin/master` a partir do branch de produção) e veja o trecho. Em geral, a causa é um hotfix não portado (passo 7). **Pergunte** como resolver. Não resolva o conflito por conta própria.

## Passo 10: Fazer o merge

1. Anote o horário UTC antes do merge (Bash: `date -u +%Y-%m-%dT%H:%M:%SZ`; PowerShell: `(Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')`). Ele é o `T0` do passo 11.
2. Faça o merge com commit de merge: `gh pr merge <n> -R ColibriAgile/<repo> --merge`. Não use squash nem rebase: o master e a produção passam a ter históricos diferentes e o próximo PR tem conflito.
3. Confira `state=MERGED` com `gh pr view <n> --json state,mergeCommit`.

Faça o merge de todos os PR prontos. Um PR com problema não bloqueia os outros, mas os pacotes que dependem dele esperam.

## Passo 11: Aguardar os builds e conferir as versões

1. Inicie a ferramenta Monitor com `bash scripts/aguardar-builds.sh <T0> <repo>:<workflow>:<branch> ...` (timeout de 30 minutos; arme de novo se expirar). Inclua todos os builds que o merge dispara, também os de pacotes fora da liberação, para saber o que foi gerado.
2. Quando um build termina com `success`, confira o release: `gh release list -R ColibriAgile/<repo> --limit 3`. Compare os 3 primeiros números da tag com a versão esperada.
   - Iguais: o pacote está pronto para o deploy.
   - Diferentes: não faça deploy desse pacote nem dos pacotes que dependem dele. Avise o usuário logo.
3. Quando um build falha, leia o log (`gh run view <id> --log-failed`):
   - Falha do runner: `gh run rerun <id> --failed` e acompanhe com `aguardar-execucoes.sh`.
   - Erro de código ou de configuração do build: corrija no master com um commit pequeno (Conventional Commits), abra outro PR para o mesmo branch de produção, faça o merge e aguarde o novo build. Se a correção muda comportamento do produto, **Pergunte** antes.

## Passo 12: Fazer os deploys

Comece os deploys quando os builds dos pacotes a liberar terminarem e as versões estiverem conferidas. Siga a ordem do passo 5. Um pacote só vai depois que o deploy de cada pacote que ele exige terminar com o pacote certo enviado.

Para cada pacote:

1. Confira qual release o deploy vai pegar:
   - `deploy.yml` com `tag_prefix` e que repassa o `tag-prefix`: o release mais recente com o prefixo. Ele tem de ser o release conferido no passo 11.
   - `deploy.yml` sem entrada: o release **Latest** (`gh release view -R ColibriAgile/<repo> --json tagName`). Ele tem de ser o release conferido.
   - `deploy.yml` com a entrada `tag_prefix` que não é repassada: o deploy pega o Latest e ignora a entrada. **Pergunte** se corrige o `deploy.yml` (adicionar `tag-prefix: ${{ inputs.tag_prefix }}` no `with:` da action) ou se marca o release certo como Latest.
2. Dispare: `gh workflow run deploy.yml -R ColibriAgile/<repo> --ref master [-f tag_prefix=<prefixo>]`. O comando mostra a URL da execução, com o id no fim.
3. Acompanhe com a ferramenta Monitor e `bash scripts/aguardar-execucoes.sh <repo>:<runId> ...`.
4. Ao terminar, rode `bash scripts/conferir-deploy.sh <repo>:<runId>`. O deploy está certo só com o `.cmpkg` da versão esperada e `Enviados: 1`. Com `Ignorados: 1`, o pacote já estava no S3: confira se ele é o pacote certo.
5. Não faça deploy de pacotes que o merge gerou mas que não estão na liberação (por exemplo, o Dashboard do DConnect quando a tarefa não o pede).

Os deploys de pacotes sem dependência entre si podem rodar ao mesmo tempo.

## Passo 13: Publicar no market-place

Só quando o usuário escolheu publicar no passo 8. O deploy envia o pacote ao S3 e registra o pacote no market-place como pendente (`publicado = false`). Este passo publica o pacote pendente com uma nota de release. Depois da publicação, as lojas recebem a versão, e a publicação não volta. Por isso, o item 3 pede a confirmação final.

1. Selecione os pacotes com deploy certo no passo 12 (`Enviados: 1`). Para cada pacote, use o `nome` do manifesto e a versão completa da tag do release, sem o prefixo (`app/1.6.1.141` vira `1.6.1.141`).
2. Rode `python -I scripts/publicar-market.py consultar <Nome>:<versão> ...`.
   - Pacote `pendente`: entra na publicação.
   - Pacote `publicado`: fica fora. Registre no relatório.
   - Pacote que não existe: o deploy não registrou o pacote. Procure `Falha ao notificar o marketplace` no log do deploy e **Pergunte**. Um deploy com `Ignorados: 1` também não registra o pacote.
3. Escreva 1 nota em markdown por pacote, a partir das tarefas da liberação que entregam esse pacote. Siga o padrão das notas do market-place:

   ```markdown
   **Novidades**
   * <resumo da tarefa> ([WIN-1234](https://colibri.atlassian.net/browse/WIN-1234))

   **Correções**
   * <resumo da tarefa> ([WIN-1235](https://colibri.atlassian.net/browse/WIN-1235))
   ```

   Uma tarefa do tipo Bug vai para "Correções". As outras tarefas vão para "Novidades". Omita uma seção sem itens. Escreva o resumo para quem usa o produto, sem termos internos. Se o pacote já tem nota (`com nota` na consulta), a nota nova substitui o texto dela.
4. **Pergunte** (confirmação final): mostre cada pacote, a versão e a nota. Dê as opções "Publicar", "Editar as notas" e "Não publicar". Com "Editar as notas", aplique o texto do usuário e pergunte de novo.
5. Grave o JSON numa pasta temporária: `[{"nome": "<Nome>", "versao": "<versão completa>", "nota": "<markdown>"}]`. Use a ferramenta Write, porque o markdown tem quebras de linha e aspas.
6. Rode `python -I scripts/publicar-market.py publicar <arquivo.json> --simular`. Confira que o PUT enviaria os pacotes certos.
7. Rode `python -I scripts/publicar-market.py publicar <arquivo.json>`. O script lê o token de `COLIBRI_MARKET_TOKEN`, faz 1 PUT com todos os pacotes e confere `publicado` e a nota de cada pacote. O PUT é tudo ou nada: com um erro, nenhum pacote muda.
8. Trate o resultado:
   - Código 0 com `OK` em cada pacote: siga.
   - `401`: o token está errado ou foi revogado. Não tente de novo. Avise o usuário: o administrador da empresa cria um token novo na tela da empresa, no market-place.
   - `403`: um pacote é de outra empresa, e o token publica só pacotes da empresa dele. **Pergunte**.
   - Outro erro (`404`, `500`, rede): mostre a resposta e **Pergunte**. Antes de tentar de novo, rode `consultar`: o PUT pode ter publicado os pacotes antes do erro.
   - `400`: o JSON tem um item mal formado. Corrija o JSON e volte ao item 6.

Não mostre o token na conversa, nos comandos nem no relatório. O market-place envia a mensagem do Slack da publicação com a nota.

**Saída:** para cada pacote, publicado (com a data), já publicado antes ou não publicado (com o motivo).

## Passo 14: Lançar as versões do Jira

Lance uma versão só quando todos os pacotes dela estão em produção: deploy com o pacote certo (`Enviados: 1`) ou pacote já liberado antes. Se um pacote da versão teve versão diferente ou deploy com falha, não lance a versão e registre o motivo.

Use como data de lançamento o dia do deploy (`yyyy-mm-dd`). Faça as ações que o passo 8 decidiu:

1. **Versão nova para as pendentes:** crie com `manageJiraProjectVersion` (`action: "create"`, `projectIdOrKey`, `name`). Guarde o id.
2. **Lançar:** `manageJiraProjectVersion` com `action: "release"`, `versionId` e `releaseDate`. Se a versão tem tarefa pendente, passe também `moveUnfixedIssuesTo` com o id da versão de destino. Este movimento não volta se a versão for reaberta depois.
3. **Versão renomeada:** crie a versão com o nome certo, já lançada (`action: "create"`, `released: true`, `releaseDate`). Troque a fixVersion das tarefas liberadas com `editJiraIssue`. O campo `fixVersions` substitui a lista inteira: envie todos os ids da tarefa, com o id novo no lugar do antigo.
4. **Pacote liberado antes por outra pessoa, numa versão maior:** o código da versão da tarefa foi para produção dentro da outra versão. **Pergunte** se lança a versão da tarefa com a data daquele deploy.

Depois, confira com `searchJiraIssuesUsingJql`: as fixVersions das tarefas aparecem com `released: true`, e as tarefas pendentes estão na versão de destino.

## Passo 15: Relatório e comentários

Escreva o relatório na conversa com este modelo:

```markdown
# Liberação para produção: <CHAVES> (<data>)

<1 frase: quantos pacotes foram liberados e quais não foram.>

## Regra da comparação
<1 frase: o 4º número é o número da execução do workflow; a comparação usa os 3 primeiros.>

## Integração no master
<Só no modo branch: branch de origem, PR para o master, ajuste do versao.ini (commit) e remoção do branch local e remoto.>

## Pacotes
| # | Pacote | Versão do QA | Versão em produção | PR | Deploy | Market-place |
|---|---|---|---|---|---|---|
| 1 | <Pacote> | <versão QA> | <versão gerada> ✅/❌ | [<repo>#<n>](<url>) | OK / falha / sem deploy | publicado em <data> / já publicado / não publicado (<motivo>) / fora da liberação |

## Avisos
1. <Versão diferente, ajuste do versao.ini, dependência não atendida, conflito resolvido, correção de workflow, ...>
2. <Commits do master que foram para produção sem o teste do QA, por repositório.>
3. <Checks com falha no merge (SonarCloud, reexecução por falha do runner).>
4. <Pacotes gerados e sem deploy; itens fora dos pacotes que ficaram pendentes.>

## Versões do Jira
| Versão | Situação | Tarefas pendentes |
|---|---|---|
| <nome> | Lançada em <data> / não lançada (<motivo>) | <nenhuma / movidas para <versão>: <chaves>> |
```

Depois, adicione 1 comentário em cada tarefa com `addOrEditJiraIssueComment` (`contentFormat: "markdown"`):

- Use o mesmo modelo, só com os pacotes da tarefa. Cite as outras tarefas da mesma liberação.
- Escreva o comentário para quem lê a tarefa: diga o que foi feito e o commit de cada mudança, sem frases da conversa como "com a sua aprovação".
- Não ponha código dentro de negrito.

Ao final, informe ao usuário o id de cada comentário e as pendências.
