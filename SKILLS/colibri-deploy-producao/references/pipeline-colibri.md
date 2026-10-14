# Pipeline de liberação Colibri

Esta referência descreve como os repositórios da organização `ColibriAgile` geram e publicam os pacotes `.cmpkg`. Os dados vêm de uma liberação real (WIN-3159, 14/10/2026). Confira sempre o estado atual com `scripts/estado-repo.py`: os workflows mudam.

## Sumário

- [Versão do pacote](#versão-do-pacote)
- [Dependências no manifesto.server](#dependências-no-manifestoserver)
- [Mapa de pacotes conhecidos](#mapa-de-pacotes-conhecidos)
- [Build](#build)
- [Deploy](#deploy)
- [Jira](#jira)
- [Problemas conhecidos](#problemas-conhecidos)

## Versão do pacote

A action `ColibriAgile/build-tools/.github/actions/versao-ini` monta a versão assim:

```
<MajorVersion>.<MinorVersion>.<Release>.<github.run_number>
```

- Os 3 primeiros números vêm do `versao.ini` (seção `[versaoinfo]`).
- O 4º número é o número da execução do workflow. Cada execução aumenta esse número. Por isso, o build de produção nunca repete o 4º número do pacote que o QA testou.
- O `versao.ini` fica em `_build/` ou `.build/`. Um repositório com mais de um build tem 1 subpasta por build (por exemplo, `.build/app/` e `.build/scripts/`).

## Dependências no manifesto.server

O `manifesto.server` fica na pasta `pacote/` ao lado do `versao.ini` (às vezes em outra pasta, como `dist/`). O campo `nome` é o nome do pacote. O campo `dependencias` liga o nome de outro pacote a um padrão de versão:

```json
"dependencias": {
  "POSScripts": "2.9.2.*",
  "PIS": "1.6.1.*",
  "Master": "6.5.*"
}
```

O padrão é a versão mínima, não a versão exata (regra confirmada pelo time). Exemplo: em produção, o DConnect exige `"PIS": "1.4.1.*"` e o CBO Connect exige `"POS": "11.0.6.*"`, e a produção tem o PIS 1.6.1 e o POS 11.2.0. Os pacotes também exigem versões diferentes do mesmo `Master` (6.1.3, 6.3, 6.6).

Para conferir uma dependência:

1. Tire o `.*` do padrão. Compare número a número com a versão do pacote exigido.
2. A dependência está atendida quando a versão do pacote exigido é igual ou maior.
3. Se a major for diferente, avise o usuário mesmo quando a versão é maior.

## Mapa de pacotes conhecidos

Use esta tabela como ponto de partida. O `estado-repo.py` mostra os valores atuais.

| Pacote | `nome` no manifesto | Repositório | `versao.ini` | Branch que dispara o build | Workflow de build | Deploy |
|---|---|---|---|---|---|---|
| POS Scripts | `POSScripts` | `pos-scripts` | `_build/` | `production` | `build.yml` | `deploy.yml`, sem entrada |
| PIS Scripts | `PISScripts` | `pos-integration-service` | `.build/scripts/` | `production-scripts` | `build-scripts.yml` | `deploy.yml`, `tag_prefix=scripts` |
| PIS | `PIS` | `pos-integration-service` | `.build/app/` | `production` | `build.yml` | `deploy.yml`, `tag_prefix=app` |
| POS (com o CIS) | `POS` | `pos` | `.build/pos/` | `production` | `build.yml` | `deploy.yml`, sem entrada |
| CBO Scripts | `CBOScripts` | `back-office` | `_build/scripts/` | `production-scripts` | `build-scripts.yml` | `deploy.yml`, `tag_prefix=scripts` |
| CBO | `CBO` | `back-office` | `_build/app/` | `production` | `build.yml` | `deploy.yml`, `tag_prefix=app` |
| CBO Reports | `CBOReports` | `back-office` | `_build/reports/` | `production-reports` | `build-reports.yml` | `deploy.yml`, `tag_prefix=reports` |
| CBO Connect | `CBOConnect` | `back-office-connect` | `.build/` | `production` | `build.yml` | `deploy.yml`, sem entrada |
| DConnect | `DConnect` | `dconnect` | `_build/DConnect/` | `production` | `build-dconnect.yml` | `deploy.yml`, `tag_prefix=dconnect` |
| Dashboard do DConnect | `DDashboard` | `dconnect` | `_build/Dashboard/` | `production` | `build-dashboard.yml` | `deploy.yml`, `tag_prefix=dashboard` |
| Catálogo (local) | ver `dist/manifesto.server` | `cloud-catalog` | `.build/` | `production` | `build-local.yml` | `deploy.yml`, sem entrada |
| Catálogo cloud | - | `cloud-catalog` | `.build/` | `production-cloud` | `build-cloud.yml` (imagem e Argo) | não usa `deploy.yml` |

O nome do pacote no Jira (fixVersions, tabelas dos comentários) é o nome de exibição: "POS Scripts", "CBO Connect", "Catalog". Ligue esse nome ao campo `nome` do manifesto e ao repositório.

## Build

- O merge no branch de produção dispara o build por `on.push.branches`. O mesmo merge dispara **todos** os workflows com esse gatilho. Exemplo: um merge no `production` do `dconnect` gera o DConnect e também o Dashboard. Faça deploy só dos pacotes da liberação.
- O build em `production*` publica um release no GitHub com a tag `<prefixo>/<versão>` (por exemplo `app/1.6.1.141`) ou só `<versão>` em repositórios com 1 build. Os builds em outros branches (`master`, branches de QA) não publicam release.
- O workflow `Limpar` apaga execuções antigas. Uma execução do QA pode não aparecer mais em `gh run list`. Procure com `--limit 200` e, se ela não existir, use os releases e o histórico de commits.
- Os runners são `self-hosted` (`[self-hosted, colibri]`). Um build pode ficar na fila alguns minutos.

## Deploy

O `deploy.yml` é `workflow_dispatch` e usa a action `deploy-s3`:

1. Com `tag-prefix`, a action pega o release mais recente com esse prefixo (pela data de publicação).
2. Sem `tag-prefix`, a action pega o release marcado como **Latest** no GitHub.
3. A action baixa o `.cmpkg` e o `manifesto.dat` do release e envia ao S3.

O log mostra o resultado. Use `scripts/conferir-deploy.sh`:

- `Downloaded col-<Pacote>_production_<versão>.cmpkg`: o pacote que a action enviou.
- `Enviados: 1`: o pacote foi para o S3.
- `Enviados: 0 | Ignorados: 1`: o pacote já estava no S3. A execução termina com falha. Isso é normal só se o pacote for o esperado e já tiver um deploy anterior.

Um deploy com conclusão `success` não prova nada sozinho. Confira sempre o nome do `.cmpkg`.

## Jira

- Site: `https://colibri.atlassian.net`. Obtenha o `cloudId` com `getAccessibleAtlassianResources`.
- `getJiraIssue` com `view: "full"` passa do limite de leitura. O harness salva o resultado em arquivo. Leia o arquivo com `scripts/jira-resumo.py`.
- `fixVersions` lista os pacotes com versão curta (por exemplo `PIS 1.6`, `POS Scripts 2.9.2`).
- Os comentários do desenvolvedor trazem tabelas "Pacotes para o QA" com a versão completa e o branch do build. Um comentário mais novo pode trocar a versão de alguns pacotes ("Os outros pacotes do comentário anterior não mudaram"). Para cada pacote, vale a versão do comentário mais recente.
- Os comentários também listam itens "fora dos pacotes" (por exemplo, scripts do cloud e deploy do Catálogo cloud). Esses itens não fazem parte desta skill. Liste-os no relatório como pendências.
- No comentário em markdown, não ponha código dentro de negrito (`**texto `código`**`): o Jira quebra a formatação.

## Problemas conhecidos

| Sintoma | Causa | Ação |
|---|---|---|
| PR com `CONFLICTING` para `production-scripts` | Hotfix feito direto no branch de produção e não portado ao master | Mostre ao usuário as 2 versões do trecho. Com a aprovação dele, faça cherry-pick do hotfix no master. O PR fica sem conflito. |
| Deploy baixa o pacote errado | `deploy.yml` tem a entrada `tag_prefix`, mas não a repassa no `with:` | Com a aprovação do usuário, adicione `tag-prefix: ${{ inputs.tag_prefix }}` no `with:` da action e dispare de novo. |
| Deploy sem entrada baixa o pacote errado | Outro release ficou como Latest | Confira `gh release view -R <repo>` antes de disparar. Pergunte ao usuário se corrige o workflow ou marca o release certo como Latest. |
| Testes falham com `MSB4166 Child node exited prematurely` ou `SDK Resolver Failure` | Falha do runner | Execute de novo com `gh run rerun <id> --failed`. |
| `SonarCloud Code Analysis` com `fail` | Quality gate | Não bloqueia o merge. Registre no relatório. |
| Versão em produção maior que a do chamado | Outra pessoa liberou uma versão mais nova | Não abra PR nem faça deploy. Avise o usuário. |
