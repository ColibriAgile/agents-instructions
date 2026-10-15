---
name: colibri-deploy-producao
description: 'Liberação para produção dos pacotes Colibri a partir de tarefas do Jira: lê uma ou mais chaves (por exemplo WIN-3159), levanta as versões dos pacotes, confere o que já foi liberado, as dependências do manifesto.server, o estado do master e os branches pendentes, abre e mescla os PR master -> production, aguarda os builds no GitHub Actions, confere as versões geradas, dispara os workflows de deploy, lança as versões do Jira (fixVersions) e comenta o resultado em cada tarefa. Use sempre que o usuário pedir para liberar, publicar, subir ou fazer deploy em produção de pacotes ou versões de uma tarefa do Jira, ou pedir os PR para o branch production, mesmo sem dizer "deploy". Não use para gerar pacotes de QA, criar releases de branches de teste, fazer deploy do Catálogo cloud (imagem e Argo) nem para alterar workflows sem uma liberação.'
argument-hint: 'Informe uma ou mais chaves de tarefa do Jira (por exemplo: WIN-3159 WIN-3160).'
---

# Liberação para produção

Esta skill leva para produção os pacotes que uma ou mais tarefas do Jira entregam. O fluxo tem ações difíceis de desfazer: merge em `production*` e envio de pacotes ao S3, que chegam às lojas. O pedido do usuário autoriza essas ações para os pacotes das tarefas. Pare e pergunte ao usuário em cada ponto de decisão marcado com **Pergunte**, porque a resposta depende de regra de negócio ou de risco que o código não mostra.

Antes de começar, leia [references/pipeline-colibri.md](./references/pipeline-colibri.md). Ela explica a versão do pacote, as dependências do manifesto, o mapa de repositórios, o build, o deploy e os problemas conhecidos.

## Ferramentas

- `gh` autenticado na organização `ColibriAgile`.
- MCP do Atlassian: `getAccessibleAtlassianResources`, `getJiraIssue`, `searchJiraIssuesUsingJql`, `editJiraIssue` e `addOrEditJiraIssueComment`. As operações de versão vêm do `discover`: `getJiraProjectVersions` (com `executeRead`) e `manageJiraProjectVersion` (com `executeDestructive`). Chame o `discover` uma vez antes de usar essas operações.
- Scripts desta skill. Nesta skill, `scripts/` quer dizer `<pasta base da skill>/scripts/`: o harness mostra a pasta base quando carrega a skill. Use caminho absoluto nos comandos. Use uma pasta temporária só como pasta de trabalho, para clones e arquivos de saída.

| Script | Uso |
|---|---|
| `jira-resumo.py <arquivo.json>...` | Resume a tarefa salva pelo `getJiraIssue` (fixVersions, descrição, comentários com tabelas). |
| `estado-repo.py <repo>...` | Mostra, só com leitura, versões, dependências, workflows, execuções do master, PR abertos, releases e hotfixes não portados. |
| `aguardar-builds.sh <T0> <repo>:<wf>:<branch>...` | Acompanha os builds disparados pelo merge. Use com a ferramenta Monitor. |
| `aguardar-execucoes.sh <repo>:<runId>...` | Acompanha execuções pelo id (deploy, reexecução). Use com a ferramenta Monitor. |
| `conferir-deploy.sh <repo>:<runId>...` | Mostra a tag, o `.cmpkg` enviado e a contagem `Enviados/Ignorados`. |

## Lista de tarefas

Antes do passo 1, crie a lista de tarefas da sessão com estes itens. Atualize cada item quando ele terminar.

1. Ler as tarefas do Jira e listar os pacotes e as versões
2. Mapear cada pacote ao repositório e ao build
3. Separar os pacotes já liberados dos pacotes a liberar
4. Conferir as dependências do `manifesto.server`
5. Conferir o estado do master (builds e testes)
6. Conferir os branches relacionados e os hotfixes não portados
7. Conferir as versões do Jira e as tarefas pendentes nelas
8. Criar os PR para os branches de produção
9. Fazer o merge dos PR
10. Aguardar os builds e conferir as versões geradas
11. Disparar os deploys na ordem das dependências e aguardar
12. Lançar as versões do Jira
13. Gerar o relatório e comentar em cada tarefa

## Passo 1: Ler as tarefas

1. Obtenha o `cloudId` com `getAccessibleAtlassianResources`.
2. Para cada chave, chame `getJiraIssue` com `view: "full"`. O resultado passa do limite e o harness o salva em arquivo. Rode `python -I scripts/jira-resumo.py <arquivos>`.
3. Monte a lista de pacotes:
   - `fixVersions` dá os pacotes e a versão curta (por exemplo `POS 11.2`).
   - As tabelas dos comentários ("Pacotes para o QA", "Pacotes para baixar") dão a versão completa e o branch do build do QA. Para cada pacote, use a versão do comentário mais recente.
   - Um pacote só em `fixVersions`, sem versão completa, entra com a versão curta. Registre isso.
4. Junte as tarefas. Se 2 tarefas pedem o mesmo pacote com os 3 primeiros números diferentes, **Pergunte** qual versão vale.
5. Separe os itens "fora dos pacotes" (scripts do cloud, Catálogo cloud, configuração manual). Eles vão para o relatório como pendências.
6. Confira se o QA aprovou cada tarefa (status e últimos comentários). Se uma tarefa não tem aprovação, **Pergunte** se ela entra.

**Saída:** tabela com pacote, versão do QA, branch do build do QA e tarefa de origem.

## Passo 2: Mapear os repositórios

1. Use o mapa da referência para achar o repositório de cada pacote. Para um pacote fora do mapa, procure o `nome` do manifesto: `gh search code '"nome": "<Nome>"' --owner ColibriAgile --filename manifesto.server`. Se a busca falhar ou não achar nada, **Pergunte** o repositório ao usuário.
2. Rode `python -I scripts/estado-repo.py <repo1> <repo2> ...` com todos os repositórios. O script leva cerca de 20 segundos por repositório: use timeout de 600000 ms ou `run_in_background`. Guarde a saída: os passos 3 a 6 usam essa saída.
3. Para cada pacote, anote:
   - o `versao.ini` e o branch de produção que dispara o build (gatilho `push` do workflow);
   - o workflow de build;
   - o deploy: a entrada `tag_prefix` e se o `deploy.yml` repassa o `tag-prefix` para a action.

**Saída:** para cada pacote, repositório, `versao.ini`, branch de produção, workflow de build e forma de deploy.

## Passo 3: Separar já liberados e a liberar

Compare só os 3 primeiros números. O 4º número é o número da execução do workflow e sempre muda (veja a referência).

Para cada pacote:

1. **A liberar:** o `versao.ini` do master tem a versão esperada, e o master tem commits que o branch de produção não tem.
2. **Já liberado:** o branch de produção já tem a versão esperada, o master não tem commits novos para esse build, e existe release com essa versão. Confira se o deploy desse release já rodou: procure a execução do `deploy.yml` depois da data do release e confira o pacote com `conferir-deploy.sh`. Se o release existe sem deploy, o pacote volta para a lista de deploy (sem PR).
3. **Versão diferente:** o master ou a produção tem outra versão (maior ou menor). Não abra PR nem faça deploy desse pacote. Avise o usuário logo, com a versão esperada, a versão encontrada e quem liberou (PR, autor, data).

Avise o usuário em 1 frase, uma vez, que a comparação usa só os 3 primeiros números.

**Saída:** 3 listas: a liberar, já liberado (com ou sem deploy) e versão diferente.

## Passo 4: Conferir as dependências

Leia as dependências na saída do `estado-repo.py` (`manifesto.server` do master). O padrão é versão mínima (veja a referência).

1. Para cada pacote a liberar e cada dependência:
   - Se o pacote exigido está na lista de deploy, a versão dele tem de atender o padrão.
   - Se o pacote exigido não está na lista, ele tem de estar liberado em produção com versão que atende o padrão. Confira o último release de produção do repositório dele.
2. Dependências de infraestrutura (`Master`, `Guard`, `Launcher`, `DotnetCore`, `Sync`, `PGSql`, `Plugin_*`, `Binarios`, `Reports`, `NotaFiscal`) mudam pouco. Confira só as que o `estado-repo.py` marca com `<- mudou`.
3. Se uma dependência não está atendida, não faça deploy do pacote. **Pergunte** ao usuário: incluir o pacote exigido na liberação ou tirar o pacote dependente.
4. Monte a ordem do deploy: um pacote vai depois de todos os pacotes que ele exige. Em geral, os scripts vão antes das aplicações.

**Saída:** dependências conferidas e ordem do deploy.

## Passo 5: Conferir o estado do master

Na saída do `estado-repo.py`, confira a última execução de cada workflow de build e de testes no master de cada repositório a liberar.

- `success`: siga.
- Falha: leia o log com `gh run view <id> -R ColibriAgile/<repo> --log-failed`.
  - Falha do runner (por exemplo `MSB4166`, `SDK Resolver Failure`, rede): execute de novo com `gh run rerun <id> -R ColibriAgile/<repo> --failed` e aguarde.
  - Falha real de build ou de teste: não libere esse repositório. **Pergunte** ao usuário.
- `in_progress` ou `queued`: aguarde a conclusão antes do PR.

**Saída:** master sem falha em todos os repositórios a liberar.

## Passo 6: Conferir os branches

O objetivo é garantir que o master tem tudo o que o QA testou e que o merge não vai desfazer um hotfix de produção.

1. **Branches relacionados:** branches com a chave da tarefa no nome (`gh api repos/ColibriAgile/<repo>/branches --paginate --jq '.[].name' | grep -i <chave>`), branches citados nas tabelas do QA (coluna Branch) e PR abertos que citam a chave (`gh pr list -R ColibriAgile/<repo> --search <chave> --state open`). Ignore os branches sem relação com as tarefas.
2. Para cada branch relacionado que ainda existe, confira `gh api repos/ColibriAgile/<repo>/compare/master...<branch> --jq .ahead_by`. Um valor maior que 0 quer dizer commits sem merge no master. **Pergunte** ao usuário antes de seguir com esse repositório.
3. **Build do QA:** procure a execução do QA pelo número (o 4º número da versão do QA) com `gh run list -R ColibriAgile/<repo> --workflow <wf> --limit 200 --json number,headSha,headBranch`. Confira que o commit dela está no master (`compare/<sha>...master` com `behind_by` igual a 0). Liste os commits que o master tem a mais: eles vão para produção sem o teste do QA e entram no relatório.
4. **Hotfixes não portados:** o `estado-repo.py` lista os commits que estão só no branch de produção. Um hotfix que não está no master causa conflito no PR ou volta o código de produção para trás. Confira o conteúdo no master (um cherry-pick já feito também aparece na lista). Se falta o hotfix, mostre ao usuário o trecho de produção e o trecho do master e **Pergunte** se faz cherry-pick do hotfix no master.

**Saída:** branches relacionados sem commits pendentes, commits extras por repositório e hotfixes resolvidos.

## Passo 7: Conferir as versões do Jira

O passo 12 lança as versões do Jira (fixVersions) das tarefas. Uma versão lançada tem de conter só tarefas concluídas. Confira as versões antes dos PR, porque a decisão do usuário pode parar a liberação.

1. Liste as fixVersions de todas as tarefas: id, nome e `released`. Ligue cada versão a um pacote da liberação. O nome da versão usa a versão curta do pacote (por exemplo, `PIS 1.6` para o PIS 1.6.1).
2. Leia o nome atual de cada versão com `getJiraProjectVersions` (`versionId`). Outra pessoa pode renomear uma versão depois que a tarefa a recebe. Exemplo: a versão da tarefa era "CBO Connect 1.9.4" e passou a "CBO Connect 2.0", com outro escopo. Se o nome não corresponde mais ao pacote, **Pergunte**: criar uma versão com o nome certo e trocar a fixVersion das tarefas liberadas, ou não mexer.
3. Procure as tarefas pendentes com `searchJiraIssuesUsingJql`: `fixVersion in (<ids>) AND statusCategory != Done`, com `fields: ["fixVersions", "status", "summary"]` e `view: "full"` (sem `view: "full"`, as fixVersions não aparecem).
4. Para cada versão com tarefa pendente, liste as versões abertas do mesmo produto com `getJiraProjectVersions`: `projectIdOrKey`, `query` com o nome do produto (por exemplo `CBO`) e `status: ["unreleased"]`. Tire da lista a própria versão e as versões de outro produto com nome parecido (`CBO Connect`, `CBO Scripts` e `CBO Reports` não são `CBO`).
5. **Pergunte** (HIL) para cada versão com pendência. Mostre as tarefas pendentes (chave, resumo e status) e dê estas opções:
   - **Abortar:** parar a liberação antes dos PR.
   - **Mover para uma versão aberta:** 1 opção para cada versão aberta do item 4, da menor para a maior.
   - **Criar uma versão nova:** peça o nome da versão. Sugira a próxima versão de patch (por exemplo, `CBO 2.10.5` para a `CBO 2.10.4`).

   A `AskUserQuestion` aceita até 4 opções por pergunta. Use "Abortar", as 2 menores versões abertas e "Criar `<nome sugerido>`". O usuário escreve outro nome de versão nova ou outra versão aberta em "Other". Cite na pergunta as versões abertas que ficaram fora das opções.
6. Registre a decisão de cada versão. Não mova nem crie nada agora: o passo 12 faz as mudanças depois do deploy. Assim, uma liberação que para no meio não deixa o Jira com versões lançadas sem pacote em produção.

**Saída:** para cada versão, a ação do passo 12: lançar, lançar e mover as pendentes para uma versão (existente ou nova), ou criar a versão certa no lugar de uma versão renomeada.

## Passo 8: Criar os PR

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
- `CONFLICTING`: simule o merge num clone temporário (`git merge --no-commit --no-ff origin/master` a partir do branch de produção) e veja o trecho. Em geral, a causa é um hotfix não portado (passo 6). **Pergunte** como resolver. Não resolva o conflito por conta própria.

## Passo 9: Fazer o merge

1. Anote o horário UTC antes do merge (`date -u +%Y-%m-%dT%H:%M:%SZ`). Ele é o `T0` do passo 10.
2. Faça o merge com commit de merge: `gh pr merge <n> -R ColibriAgile/<repo> --merge`. Não use squash nem rebase: o master e a produção passam a ter históricos diferentes e o próximo PR tem conflito.
3. Confira `state=MERGED` com `gh pr view <n> --json state,mergeCommit`.

Faça o merge de todos os PR prontos. Um PR com problema não bloqueia os outros, mas os pacotes que dependem dele esperam.

## Passo 10: Aguardar os builds e conferir as versões

1. Inicie a ferramenta Monitor com `bash scripts/aguardar-builds.sh <T0> <repo>:<workflow>:<branch> ...` (timeout de 30 minutos; arme de novo se expirar). Inclua todos os builds que o merge dispara, também os de pacotes fora da liberação, para saber o que foi gerado.
2. Quando um build termina com `success`, confira o release: `gh release list -R ColibriAgile/<repo> --limit 3`. Compare os 3 primeiros números da tag com a versão esperada.
   - Iguais: o pacote está pronto para o deploy.
   - Diferentes: não faça deploy desse pacote nem dos pacotes que dependem dele. Avise o usuário logo.
3. Quando um build falha, leia o log (`gh run view <id> --log-failed`):
   - Falha do runner: `gh run rerun <id> --failed` e acompanhe com `aguardar-execucoes.sh`.
   - Erro de código ou de configuração do build: corrija no master com um commit pequeno (Conventional Commits), abra outro PR para o mesmo branch de produção, faça o merge e aguarde o novo build. Se a correção muda comportamento do produto, **Pergunte** antes.

## Passo 11: Fazer os deploys

Comece os deploys quando os builds dos pacotes a liberar terminarem e as versões estiverem conferidas. Siga a ordem do passo 4. Um pacote só vai depois que o deploy de cada pacote que ele exige terminar com o pacote certo enviado.

Para cada pacote:

1. Confira qual release o deploy vai pegar:
   - `deploy.yml` com `tag_prefix` e que repassa o `tag-prefix`: o release mais recente com o prefixo. Ele tem de ser o release conferido no passo 10.
   - `deploy.yml` sem entrada: o release **Latest** (`gh release view -R ColibriAgile/<repo> --json tagName`). Ele tem de ser o release conferido.
   - `deploy.yml` com a entrada `tag_prefix` que não é repassada: o deploy pega o Latest e ignora a entrada. **Pergunte** se corrige o `deploy.yml` (adicionar `tag-prefix: ${{ inputs.tag_prefix }}` no `with:` da action) ou se marca o release certo como Latest.
2. Dispare: `gh workflow run deploy.yml -R ColibriAgile/<repo> --ref master [-f tag_prefix=<prefixo>]`. O comando mostra a URL da execução, com o id no fim.
3. Acompanhe com a ferramenta Monitor e `bash scripts/aguardar-execucoes.sh <repo>:<runId> ...`.
4. Ao terminar, rode `bash scripts/conferir-deploy.sh <repo>:<runId>`. O deploy está certo só com o `.cmpkg` da versão esperada e `Enviados: 1`. Com `Ignorados: 1`, o pacote já estava no S3: confira se ele é o pacote certo.
5. Não faça deploy de pacotes que o merge gerou mas que não estão na liberação (por exemplo, o Dashboard do DConnect quando a tarefa não o pede).

Os deploys de pacotes sem dependência entre si podem rodar ao mesmo tempo.

## Passo 12: Lançar as versões do Jira

Lance uma versão só quando todos os pacotes dela estão em produção: deploy com o pacote certo (`Enviados: 1`) ou pacote já liberado antes. Se um pacote da versão teve versão diferente ou deploy com falha, não lance a versão e registre o motivo.

Use como data de lançamento o dia do deploy (`yyyy-mm-dd`). Faça as ações que o passo 7 decidiu:

1. **Versão nova para as pendentes:** crie com `manageJiraProjectVersion` (`action: "create"`, `projectIdOrKey`, `name`). Guarde o id.
2. **Lançar:** `manageJiraProjectVersion` com `action: "release"`, `versionId` e `releaseDate`. Se a versão tem tarefa pendente, passe também `moveUnfixedIssuesTo` com o id da versão de destino. Este movimento não volta se a versão for reaberta depois.
3. **Versão renomeada:** crie a versão com o nome certo, já lançada (`action: "create"`, `released: true`, `releaseDate`). Troque a fixVersion das tarefas liberadas com `editJiraIssue`. O campo `fixVersions` substitui a lista inteira: envie todos os ids da tarefa, com o id novo no lugar do antigo.
4. **Pacote liberado antes por outra pessoa, numa versão maior:** o código da versão da tarefa foi para produção dentro da outra versão. **Pergunte** se lança a versão da tarefa com a data daquele deploy.

Depois, confira com `searchJiraIssuesUsingJql`: as fixVersions das tarefas aparecem com `released: true`, e as tarefas pendentes estão na versão de destino.

## Passo 13: Relatório e comentários

Escreva o relatório na conversa com este modelo:

```markdown
# Liberação para produção: <CHAVES> (<data>)

<1 frase: quantos pacotes foram liberados e quais não foram.>

## Regra da comparação
<1 frase: o 4º número é o número da execução do workflow; a comparação usa os 3 primeiros.>

## Pacotes
| # | Pacote | Versão do QA | Versão em produção | PR | Deploy |
|---|---|---|---|---|---|
| 1 | <Pacote> | <versão QA> | <versão gerada> ✅/❌ | [<repo>#<n>](<url>) | OK / falha / sem deploy |

## Avisos
1. <Versão diferente, dependência não atendida, conflito resolvido, correção de workflow, ...>
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
