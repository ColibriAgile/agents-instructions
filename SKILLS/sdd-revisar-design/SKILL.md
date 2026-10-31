---
name: sdd-revisar-design
description: Revisão de design SDD por Goldfish de contexto zero sobre PRD, TechSpec e tasks, antes da implementação. Use no nível sdd-egm de sdd-orquestrar-fluxo, antes dos HILs 1 e 2, ou quando pedirem para testar se uma especificação SDD se sustenta sozinha. Não use para revisar código implementado (sdd-revisar-codigo) nem para redigir os artefatos.
argument-hint: --prd nome-da-feature --escopo produto|projeto
---

# Revisar design SDD

Dois papéis. O **Elefante** é esta sessão: escreveu ou herdou os artefatos, conhece as decisões e por isso resolve os achados; pelo mesmo motivo concorda com o próprio texto. O **Goldfish** é um subagente de contexto zero que só sabe o que está nos artefatos e no código que eles citam: se ele não entende ou não consegue implementar, falta algo no artefato. O Goldfish testa; o Elefante decide e edita.

| Escopo | Momento | Alvo | Lentes por rodada | Parada |
| --- | --- | --- | --- | --- |
| `produto` | Antes do HIL 1 | `prd.md` | `compreensao`, `zoom-out` | Rodada limpa; teto de 2 rodadas (uma re-auditoria) |
| `projeto` | Antes do HIL 2 | `techspec.md`, `tasks.md`, `task_*.md` (PRD como fonte citada) | `compreensao`, `zoom-out`, `critico`, `prontidao`, `codigo` | Duas rodadas limpas seguidas; teto de 3 rodadas |

Antes do passo 4, leia integralmente [references/resolucao.md](references/resolucao.md): ela define **aberto**, **assentado** e **rodada limpa** e rege a resolução.

1. **Preparar.** Resolva `tasks/prd-[slug]/` e exija os artefatos do alvo. Leia só a pasta `designreview_[num]/` mais recente do escopo: com estado `EM ANDAMENTO`, ela continua o ciclo: com `Resolução aplicada: sim` no cabeçalho, siga ao passo 7; senão, despache de novo nela, a partir do passo 3, as lentes sem arquivo completo; em qualquer outro estado, um ciclo novo começa na rodada 1 e herda os achados assentados do ciclo anterior. Confira a elegibilidade pela seção Elegibilidade de `references/revisao-delegada.md` da skill `sdd-revisar-codigo`, sem a exigência de build e teste. Sem subagente elegível, pare com estado `BLOQUEADO`: revisão no mesmo contexto não é Goldfish, e autoavaliação não a substitui.
   **Saída:** alvo, escopo, rodada atual, achados assentados herdados e pasta a usar, ou bloqueio informado ao chamador.
2. **Reservar.** Para rodada nova, reserve o próximo sufixo livre `designreview_[num]/`, considerando todas as pastas existentes. Grave nela o cabeçalho de `designreview.md` pelo [assets/designreview.template.md](assets/designreview.template.md), lido integralmente, com estado `EM ANDAMENTO`, `HEAD`, `git status --porcelain` e o sha256 de cada artefato alvo. Sob `sdd-orquestrar-fluxo`, grave o checkpoint com `safe_to_stop: false` e um item `active_work` por lente, `{kind: "goldfish", handle, owner, scope: "designreview_[num]/[lente]", state: "em-execucao"}`, preenchendo `handle` assim que o host o devolver.
   **Saída:** pasta com cabeçalho gravado antes do despacho; estado conservador no checkpoint.
3. **Despachar.** Leia integralmente [references/contrato-goldfish.md](references/contrato-goldfish.md) e lance em paralelo, uma por subagente novo, as lentes do escopo ainda sem arquivo completo, com a instrução que o contrato define. Lente que falha, expira ou não termina o arquivo roda de novo uma vez; persistindo, registre `não rodou`, que nunca conta como zero achados.
   **Saída:** cada lente com `[lente].md` completo ou estado `não rodou`.
4. **Consolidar.** Compare os sha256 dos artefatos alvo e o `git status` com o cabeçalho, desconsiderando `checkpoint*.json`, `snapshot-contexto.md`, `workflow.md`, o log de decisões e a própria pasta da rodada. Artefato alvo alterado ou outro arquivo mudado é rodada contaminada: grave `BLOQUEADO` com a contaminação em Limitações e devolva. Copie a paráfrase da lente `compreensao` sem resumir e compare-a com a intenção que você conhece (pedido, PRD, decisões): paráfrase que diverge é achado `Bloqueante` da lente `compreensao`, porque o artefato não transmite o que deveria. Junte achados duplicados, dê IDs `DR[num]-NN`, marque cada um como novo, reaberto ou assentado, e classifique a rodada como limpa ou não antes de qualquer correção.
   **Saída:** `designreview.md` com estado das lentes, paráfrase, comparação com a intenção, achados identificados e rodada classificada.
5. **Resolver.** Siga [references/resolucao.md](references/resolucao.md) e classifique cada achado aberto como `CONTESTAR`, `ESCALAR`, `CORRIGIR` ou `RECUSAR`, com justificativa e, para `CORRIGIR`, a edição exata. Grave no `designreview.md`.
   **Saída:** nenhum achado aberto sem categoria; toda contestação cita evidência que o Goldfish poderia ler.
6. **Gate de resolução.** Sem nenhum `CORRIGIR` ou `ESCALAR`, pule para o passo 7. Senão, apresente primeiro os `ESCALAR`, depois a contagem por categoria e o caminho do relatório, e pergunte uma vez: aplicar todas as correções propostas (recomendada), decidir item a item, seguir sem aplicar ou devolver à redação. Com o checkpoint em `mode: auto`, decida pela seção Revisão de design de `references/modo-autonomo.md` da skill `sdd-orquestrar-fluxo`. Aplique as edições aprovadas preservando IDs e registre a decisão de cada achado. Depois grave no cabeçalho `Resolução aplicada: sim`, para que uma retomada não confunda as correções com contaminação.
   **Saída:** decisões humanas ou autônomas registradas por achado; artefatos editados só no que foi aprovado; resolução marcada no cabeçalho.
7. **Iterar.** Rodada que atinge o critério de parada do escopo, ou rodada limpa no teto ou na rodada extra, encerra com `CONVERGIDO`. Há **churn** quando um achado novo cai no escopo de uma correção desta revisão e reverter essa correção o resolveria. Sem convergência, abaixo do teto e sem churn, volte ao passo 2 com rodada nova. No teto ou no churn, liste os achados abertos e as correções aplicadas sem re-auditoria, por severidade, e pergunte uma vez: aceitar com pendências, rodar uma única rodada extra ou devolver à redação. A rodada extra que não convergir só oferece aceitar ou devolver.
   **Saída:** volta ao passo 2, ou estado final gravado no `designreview.md` da última rodada: `CONVERGIDO`, `ACEITO COM PENDÊNCIAS` ou `DEVOLVIDO À REDAÇÃO`.
8. **Devolver.** Atualize `active_work` e grave o caminho do relatório em `sources.design_review` sob o fluxo. Devolva ao chamador estado final, caminho, paráfrase com a comparação e achados escalados com a decisão. `DEVOLVIDO À REDAÇÃO` volta à skill dona do artefato (`sdd-criar-prd`, `sdd-criar-techspec` ou `sdd-planejar-tasks`) e depois a esta revisão, num ciclo novo. Em uso avulso, faça a pausa de sessão de `references/continuidade-sessao.md` da skill `sdd-orquestrar-tasks` com a aprovação humana do artefato e depois `sdd-criar-techspec` (escopo `produto`) ou `sdd-orquestrar-tasks` (escopo `projeto`) como próximo passo.
   **Saída:** chamador com estado e evidência suficientes para o HIL, sem nenhum achado aberto omitido.

Uma rodada nova sempre usa subagentes novos: um Goldfish que já leu a versão anterior deixou de ser Goldfish.

## Mudança no PRD aprovado

No escopo `projeto`, achado cuja correção altera o PRD aprovado é `ESCALAR`, e esta skill não edita o PRD. Se o humano aprovar a mudança, o estado é `DEVOLVIDO À REDAÇÃO` com o PRD como alvo: o fluxo volta a `sdd-criar-prd`, à revisão de escopo `produto` e ao HIL 1. Confirmado sem mudança, o fato vira premissa registrada na TechSpec.
