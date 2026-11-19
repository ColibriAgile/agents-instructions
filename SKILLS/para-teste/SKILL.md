---
name: para-teste
description: 'Passa uma tarefa do Jira para teste ao final da sessão: valida a tarefa, envia o código, dispara o build, comenta com o link do pacote e move a tarefa para Ready to test.'
argument-hint: '[CHAVE-123] [@usuário a mencionar no comentário]'
disable-model-invocation: true
---

# Para teste

A skill fecha a sessão e entrega a tarefa ao QA. Uma falha num passo para a skill: os passos seguintes ficam sem fazer, e o relatório diz onde a skill parou.

## Constantes

Os passos citam estes itens pelo nome. Os valores ficam só aqui.

| Item | Valor |
|---|---|
| Site Atlassian | `colibri.atlassian.net` (o `cloudId` aceita o hostname) |
| Status de entrada | `In Progress` ou `Ready to test` |
| Status de saída | `Ready to test` |
| Campo Sprint | `customfield_10020` |
| Campo Release title | `customfield_10088` |
| Campo Release notes | `customfield_10089` |
| Campo Refinement | `customfield_10545` |

As operações `listJiraIssueTransitions`, `lookupJiraAccountId`, `getJiraBoardSprintData`, `getJiraProjectVersions` e `listJiraProjectComponents` rodam pelo `executeRead` do MCP do Atlassian.

## Argumentos

- **Chave da tarefa** (`ABC-123`): opcional. Sem ela, procure a chave no contexto da sessão, no nome da branch e nas mensagens dos commits locais. Sem chave nesses lugares, **pergunte**.
- **Usuário a mencionar**: opcional. Com ele, o comentário do passo 6 menciona esse usuário. Sem ele, o comentário fica sem menção.

## Passo 1: Validar a tarefa

1. Leia a tarefa com `getJiraIssue`, `view: "evidence"` e `fields` com `status`, `assignee`, `fixVersions`, `components`, `project` e os 4 campos das constantes. Um campo que vem só com o `id`, sem `value`, está vazio. Um campo que não vem na resposta não existe no projeto: o item dele não se aplica.
2. Leia o usuário atual com `atlassianUserInfo`.
3. Confira cada item:

   | Item | Correto quando |
   |---|---|
   | Status | é um status de entrada |
   | Assignee | é o usuário atual |
   | Versão | `fixVersions` tem 1 versão ou mais, sem `released: true` |
   | Componente | `components` tem 1 componente ou mais |
   | Sprint | o campo Sprint tem uma sprint com `state: active` |
   | Release title | preenchido |
   | Release notes | preenchido |
   | Refinement | preenchido |

4. Se o status está errado, mostre o status atual e pare.
5. Para cada outro item errado, monte uma proposta:
   - **Assignee:** o usuário atual. Mostre o assignee atual e o proposto.
   - **Versão:** as versões `unreleased` do projeto (`getJiraProjectVersions`). Proponha a versão mais usada pelas tarefas recentes do mesmo componente: `searchJiraIssuesUsingJql` com `project = <projeto> AND component = "<componente>" AND fixVersion in unreleasedVersions() ORDER BY updated DESC`, `fields: ["fixVersions"]`.
   - **Componente:** os componentes do projeto (`listJiraProjectComponents`). Proponha o componente que corresponde ao repositório da sessão.
   - **Sprint:** a sprint ativa do board da tarefa (`getJiraBoardSprintData` com `projectKeyOrId` e `includeIssues: false`; o `boardId` de uma sprint antiga da tarefa evita ambiguidade).
   - **Release title e Release notes:** um texto para o cliente final, em pt-BR, escrito a partir da descrição da tarefa e do que a sessão mudou. O título tem 1 linha. As notas dizem o que muda para o usuário, sem nome de classe, arquivo ou tabela.
   - **Refinement:** um texto com as seções `Contexto`, `User Story`, `Situação Atual`, `Melhoria Proposta`, `Critérios de Aceite` e `Notas Técnicas`, escrito a partir da descrição da tarefa.
6. Mostre todas as propostas numa só mensagem e **pergunte** quais a skill grava.
7. Grave as propostas aprovadas:
   - Sprint: `transitionJiraIssue` com `sprintId`, sem `transitionId`.
   - Os outros itens: 1 chamada `editJiraIssue`, com `assignee`, `fixVersions`, `components` e os campos de release e Refinement em `fields`.
8. Se o usuário recusa uma proposta, guarde o item como **pendência** e **pergunte** se a skill continua com a pendência.

*Pronto quando:* o status é um status de entrada, e cada outro item está correto, gravado ou aceito como pendência.

## Passo 2: Decidir o destino da branch

1. Leia a branch atual com `git branch --show-current`. A branch principal é `main` ou `master`, a que existe no `origin`.
2. Se a branch atual é a principal, vá ao passo 3.
3. Se não é, **pergunte**:
   - **Merge e apagar:** merge da branch na principal, push da principal e remoção da branch local e da remota.
   - **Push da branch:** push só da branch atual.

*Pronto quando:* a branch de destino do push é conhecida.

## Passo 3: Commit e push

1. Se `git status --porcelain` mostra alterações, faça o commit na branch atual. O título e o idioma seguem o `git log -8 --format=%s`. A mensagem é conventional commit, com 1 linha em branco entre o título e os bullets. Os hooks rodam sempre: um hook com falha para a skill.
2. Com **Push da branch:** `git push`. Sem upstream, `git push -u origin <branch>`.
3. Com **Merge e apagar:**
   1. `git fetch origin`, `git switch <principal>` e `git pull --ff-only`.
   2. `git merge <branch>`. Se o merge tem conflito, faça `git merge --abort`, volte para a branch e pare.
   3. `git push`.
   4. `git branch -d <branch>` e `git push origin --delete <branch>`. Se o `-d` recusa, mostre `git log <principal>..<branch>` e **pergunte**. A resposta `remote ref does not exist` quer dizer que a branch remota já não existe.
4. Se o push é recusado por não ser fast-forward, faça `git pull --rebase` e o push de novo. Se o rebase tem conflito, faça `git rebase --abort` e pare. Outra recusa (permissão, branch protegida): mostre a saída e pare.
5. Guarde o SHA enviado: `git rev-parse HEAD`.

*Pronto quando:* `git status -sb` mostra a branch de destino sem commits à frente do `origin`.

## Passo 4: Disparar o build

1. Leia `.github/workflows/*.yml`. Os candidatos são os workflows de build com `workflow_dispatch` ou com `on.push` para a branch de destino. Ignore deploy, limpeza e análise.
2. Se há mais de 1 candidato, **pergunte** qual é o build da tarefa.
3. Se o workflow tem `on.push` para a branch de destino, o push já disparou o build. Procure a execução com `gh run list --workflow <arquivo> --commit <SHA> --json databaseId,url,status`. A execução leva alguns segundos para aparecer: repita a busca a cada 10 segundos, por até 2 minutos. Cada execução nova aumenta o 4º número da versão do pacote, por isso a skill usa esta execução e não dispara outra.
4. Se o workflow não tem `on.push` para a branch, ou a busca do item 3 termina sem execução, dispare: `gh workflow run <arquivo> --ref <branch de destino>`. O disparo exige `workflow_dispatch` no workflow. Depois, repita a busca do item 3 até a execução aparecer.
5. Espere o fim com `gh run watch <id> --exit-status`. Os runners podem ficar na fila: rode a espera em segundo plano ou repita a espera até o fim da execução.
6. Se a execução falha:
   - Leia `gh run view <id> --log-failed`.
   - Se a falha é do runner (`MSB4166`, `SDK Resolver Failure`, runner perdido), rode `gh run rerun <id> --failed` 1 vez e espere de novo.
   - Outra falha: mostre o erro e pare. A tarefa fica sem comentário e no mesmo status.

*Pronto quando:* a execução do SHA enviado terminou com `success`, e o id e a URL dela estão guardados.

## Passo 5: Obter o link do pacote

1. Leia os artefatos da execução: `gh api repos/{owner}/{repo}/actions/runs/<id>/artifacts --jq '.artifacts[] | {id, name, expires_at}'`. O `gh` completa `{owner}` e `{repo}` com o repositório atual.
2. O link de cada artefato é `https://github.com/<owner>/<repo>/actions/runs/<id>/artifacts/<artifact id>`. A versão do pacote está no nome do artefato (por exemplo `col-POS_master_11_2_0_159.zip` → `11.2.0.159`).
3. Se a execução não tem artefato, procure:
   - um release do SHA enviado: para cada tag de `gh release list --limit 5`, compare `git rev-list -n 1 <tag>` com o SHA (faça `git fetch --tags` antes). O link é o `url` de `gh release view <tag> --json url`;
   - uma página publicada: o `id` do deployment em `gh api "repos/{owner}/{repo}/deployments?sha=<SHA>"`. O link é o `environment_url` do primeiro item de `gh api repos/{owner}/{repo}/deployments/<id>/statuses`.
4. Se nenhum link existe, **pergunte** ao usuário o link do pacote.

*Pronto quando:* há 1 link ou mais, cada um com o nome do pacote, a versão e a data de validade quando o link é um artefato.

## Passo 6: Comentar na tarefa

1. Monte o comentário em HTML, no formato dos comentários "Pacotes para o QA":

   ```html
   <p>MENÇÃO</p>
   <h2>Pacotes para o QA</h2>
   <p>O build passou em dd/mm/aaaa. Os links expiram em <strong>dd/mm/aaaa</strong>.</p>
   <table><thead><tr><th><p>Pacote</p></th><th><p>Versão</p></th><th><p>Branch</p></th><th><p>Download</p></th></tr></thead>
   <tbody><tr><td><p>…</p></td><td><p>…</p></td><td><p>…</p></td><td><p><a href="LINK">NOME</a></p></td></tr></tbody></table>
   <h2>O que testar</h2>
   <ol><li><p>…</p></li></ol>
   ```

   - **Menção:** só com o argumento de usuário. Ache o `accountId` com `lookupJiraAccountId`. Com mais de 1 resultado, **pergunte** qual é. A menção é `<span data-type="mention" data-user-id="<accountId>">@<displayName></span>`. Sem o argumento, tire o parágrafo da menção.
   - **Validade:** a frase sai quando o link não é um artefato.
   - **O que testar:** 1 item por comportamento que a sessão mudou, ligado aos critérios de aceite da tarefa. Escreva cada item como uma ação do QA e o resultado esperado.
2. Publique com `addOrEditJiraIssueComment`, `contentFormat: "html"`.

*Pronto quando:* o Jira retornou o `commentId`.

## Passo 7: Mover para Ready to test

1. Se a tarefa já está no status de saída, vá ao passo 8.
2. Leia as transições com `listJiraIssueTransitions`. Escolha a transição que leva ao status de saída. O nome da transição pode ser diferente do nome do status.
3. Chame `transitionJiraIssue` com o `transitionId`.
4. Se nenhuma transição leva ao status de saída, mostre as transições disponíveis e pare.

*Pronto quando:* a resposta de `transitionJiraIssue` mostra o status de saída, ou a tarefa já estava nele.

## Passo 8: Relatório

Informe ao usuário:

- a chave da tarefa e o status final;
- os campos gravados no passo 1 e as pendências aceitas;
- a branch enviada, o SHA e, com merge, as branches removidas;
- a URL da execução do build;
- os links dos pacotes;
- o link do comentário;
- o passo em que a skill parou, se parou.

*Pronto quando:* o relatório tem cada item que se aplica à execução.
