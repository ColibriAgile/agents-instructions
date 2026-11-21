---
name: colibri-testar-pacote
description: 'Fecha o pacote da branch atual no GitHub, corrige o build até passar, baixa o pacote e aplica no Colibri Master local.'
argument-hint: '[repositório] [pacote] [URL do Master] [pasta de destino]'
disable-model-invocation: true
---

# Testar pacote

A skill leva o código da sessão até o Colibri Master local: commit, push, build, download e aplicação. Uma falha que a skill não corrige para a skill: os passos seguintes ficam sem fazer, e o relatório diz onde a skill parou.

## Constantes

Os passos citam estes itens pelo nome. Os valores ficam só aqui.

| Item | Valor |
|---|---|
| URL do Master padrão | `http://localhost:4000` |
| Pasta de destino padrão | `D:/GitHubArtifacts` |
| Rodadas de correção | 3 no máximo |
| Script de aplicação | `pwsh <pasta-da-skill>/scripts/aplicar-pacote.ps1` (**mutating**; com `-Conferir`, **read-only**) |

## Argumentos

Todos os argumentos são opcionais. A skill reconhece cada argumento pela forma, em qualquer ordem. O caso comum é a skill sem argumentos, no fim de uma tarefa: a sessão dá o repositório e o pacote.

- **URL do Master:** um argumento que começa com `http`. Sem ele, use a URL do Master padrão.
- **Caminho:** se o caminho é um repositório git, é o repositório. Se não é, é a pasta de destino. Sem pasta de destino, use a pasta de destino padrão.
- **Nome:** se uma pasta irmã do repositório atual tem esse nome e é um repositório git, o nome é o repositório (`pos`, `back-office`). Se não, o nome é o pacote: o campo `nome` do `manifesto.server` (`PIS`, `POSScripts`). Compare o pacote sem espaços e sem diferença de maiúsculas, assim `CBO Scripts` é `CBOScripts`.

Sem argumento de repositório, a skill escolhe o repositório assim:

1. Sem argumento de pacote, ou se o repositório da pasta atual gera o pacote: o repositório da pasta atual.
2. Se não: o repositório do pacote no mapa de pacotes de `../colibri-deploy-producao/references/pipeline-colibri.md`, na pasta irmã com o nome dele.
3. Se o mapa não tem o pacote, ou a pasta não existe: **pergunte** o caminho do repositório.

Rode os comandos `git` e `gh` dos passos 2 a 5 na pasta do repositório.

## Passo 1: Conferir o Master

1. Rode o script de aplicação com `-Conferir -MasterUrl <URL do Master>` (**read-only**).
2. Se o código de saída não é `0`, mostre o `stderr`, peça ao usuário para iniciar o Master e pare.

*Pronto quando:* o script terminou com código `0`.

## Passo 2: Commit e push da branch atual

O push e o build usam a branch atual, sem merge.

1. Se `git status --porcelain` mostra alterações, faça o commit. O título e o idioma seguem o `git log -8 --format=%s`. A mensagem é conventional commit, com 1 linha em branco entre o título e os bullets. Os hooks rodam sempre: um hook com falha para a skill.
2. Rode `git push`. Sem upstream, rode `git push -u origin <branch>`.
3. Se o push é recusado por não ser fast-forward, faça `git pull --rebase` e o push de novo. Se o rebase tem conflito, faça `git rebase --abort` e pare. Outra recusa (permissão, branch protegida): mostre a saída e pare.
4. Guarde o SHA enviado: `git rev-parse HEAD`.

*Pronto quando:* `git status -sb` mostra a branch sem commits à frente do `origin`, e o SHA está guardado.

## Passo 3: Obter a execução do build

1. Leia `.github/workflows/*.yml`. Os candidatos são os workflows de build com `workflow_dispatch` ou com `on.push` para a branch atual. Ignore deploy, limpeza e análise.
2. Se há mais de 1 candidato, escolha o workflow nesta ordem:
   1. O workflow que gera o pacote do argumento. O nome do pacote está no campo `nome` do `manifesto.server` ao lado do `versao.ini` de cada build.
   2. O workflow cujos caminhos (`on.push.paths`, pasta do `versao.ini`) contêm os arquivos que a sessão alterou.
   3. Se 1 workflow ainda não ficou claro, **pergunte** qual build gera o pacote.
3. Se o workflow tem `on.push` para a branch, o push já disparou o build. Procure a execução com `gh run list --workflow <arquivo> --commit <SHA> --json databaseId,url,status`. Repita a busca a cada 10 segundos, por até 2 minutos. Cada execução nova aumenta o 4º número da versão do pacote: use a execução que o push disparou.
4. Se o workflow não tem `on.push` para a branch, ou a busca termina sem execução, rode `gh workflow run <arquivo> --ref <branch>`. Depois, repita a busca do item 3.

*Pronto quando:* o id e a URL da execução do SHA estão guardados.

## Passo 4: Esperar e corrigir o build

1. Espere o fim com `gh run watch <id> --exit-status`. Os runners `self-hosted` podem ficar na fila: rode a espera em segundo plano ou repita a espera até o fim da execução.
2. Se a execução termina com `success`, vá ao passo 5.
3. Se a execução falha, leia `gh run view <id> --log-failed` e classifique a falha:
   - **Runner:** `MSB4166`, `SDK Resolver Failure`, runner perdido. Rode `gh run rerun <id> --failed` 1 vez e volte ao item 1. Se a mesma falha volta, pare.
   - **Externa:** secret, permissão, serviço ou pacote de terceiro fora do ar. Mostre o erro e pare.
   - **Código:** erro de compilação, teste ou análise no código do repositório. Se as rodadas de correção ainda não chegaram ao máximo, faça 1 rodada. Se chegaram, mostre o último erro e pare.
4. Uma rodada de correção:
   1. Ache a causa no código do repositório. Corrija a causa. Os testes, as etapas do workflow e as regras de análise ficam como estão.
   2. Se o repositório tem build ou teste local para a parte que falhou, rode esse build ou teste.
   3. Faça o commit da correção e o push, como no passo 2.
   4. Obtenha a execução do SHA novo, como no passo 3. Volte ao item 1.

*Pronto quando:* a execução do último SHA enviado terminou com `success`.

## Passo 5: Baixar o pacote

1. Liste os artefatos: `gh api repos/{owner}/{repo}/actions/runs/<id>/artifacts --jq '.artifacts[] | select(.name | endswith(".zip")) | .name'`. O `gh` completa `{owner}` e `{repo}` com o repositório da pasta. O nome do artefato do pacote é `col-<nome>_<branch>_<versão>.zip`, com o `nome` do manifesto. O artefato `versao-build` não é pacote.
2. Se não há artefato `.zip`, mostre a lista completa dos artefatos e pare.
3. Se há mais de 1 artefato `.zip`, use o artefato do pacote do argumento. Sem o argumento, ou sem artefato do pacote, **pergunte** quais a skill aplica.
4. Para cada artefato escolhido, rode `gh run download <id> --name <artefato> --dir "<pasta de destino>/<artefato sem .zip>"`. O `gh` extrai o conteúdo do artefato nesta pasta.
5. Mova cada `.cmpkg` da pasta do artefato para a pasta de destino e apague a pasta do artefato. Se a pasta não tem `.cmpkg`, mantenha a pasta: o passo 6 usa os arquivos `.zip` dela.

*Pronto quando:* cada artefato escolhido tem 1 arquivo de pacote ou mais na pasta de destino.

## Passo 6: Aplicar no Master

1. Para cada arquivo de pacote, rode o script de aplicação com `-Arquivo "<arquivo>" -MasterUrl <URL do Master>`. O script envia o pacote, aplica cada pacote importado e espera o fim da aplicação. A espera tem limite de 20 minutos (`-TimeoutMinutos`).
2. Leia o código de saída do script:

   | Código | Quer dizer | Ação |
   |---|---|---|
   | `0` | Todos os pacotes estão `completo` | Vá ao passo 7. |
   | `1` | Erro no envio ou na aplicação | Mostre o `stderr`: ele tem a mensagem do Master e o log de cada arquivo com erro. Pare. |
   | `2` | O Master não responde | Peça ao usuário para iniciar o Master e pare. |
   | `3` | A espera passou do limite | Mostre a URL `<URL do Master>/#/pacotes` e pare. |

   A mensagem `Terminais incompatíveis` no envio quer dizer que o Master bloqueia atualizações porque há terminais com versão incompatível.

*Pronto quando:* o script terminou com código `0` para cada arquivo de pacote.

## Passo 7: Relatório

Informe ao usuário:

- a branch, o SHA final e os commits de correção do passo 4;
- a URL da execução do build que passou;
- o caminho de cada pacote baixado;
- o nome, a versão e o estado de cada pacote no Master;
- o passo em que a skill parou, com o erro, se parou.

*Pronto quando:* o relatório tem cada item que se aplica à execução.
