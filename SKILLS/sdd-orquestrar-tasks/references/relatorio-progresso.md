# Relatório de progresso

Informa o estado da feature e das tasks a uma visão de progresso, como o mod `feature-progress`. É opcional: nunca bloqueia, pergunta ou muda uma etapa.

## Disponibilidade e responsável

- Informe só quando o host oferecer a ferramenta de progresso: `mcp__feature-progress__report` no Claude Code. Sem ela, pule cada passo de relatório sem pergunta, sem registro e sem nova tentativa.
- Informa a sessão que grava os artefatos da feature: o coordenador sob `sdd-orquestrar-fluxo`, ou a sessão que executa uma skill de etapa sozinha. Revisores delegados e exploradores nunca informam; o coordenador informa o início e o fim deles.
- Um relatório recusado ou com falha não para a etapa. Corrija a entrada uma vez quando a resposta nomear um campo errado; senão, anote no handoff e siga.

## Identidade

- `feature.id`: o slug de `tasks/prd-[slug]/`, como `02-feature-progress`. `feature.title`: o título do PRD sem `PRD — `. Envie o título em todo relatório: ele só é obrigatório no primeiro, e não atrapalha depois.
- `tasks[].id`: o ID da task (`T01`), o mesmo para tasks do plano e de correção. Envie `title` quando a task for nova no relatório, e `link` com o caminho do arquivo da task a partir da raiz do repositório, incluindo `done/` depois que a task for movida.
- Envie só o que mudou; a ferramenta junta por `id`.
- Os valores vão em inglês, como a ferramenta pede (`state`, nomes dos estados); `label`, `note` e `group` aceitam texto livre.

## Quando informar

| Evento | Skill e passo | Relatório |
| --- | --- | --- |
| Plano gravado | `sdd-planejar-tasks`, o rascunho revisável | Cada task: `title`, `state: pending`, `link` e `steps` `{ done: 0, total }`, com `total` igual ao número de checkboxes de subtarefa |
| Fase ou status gravado com valor novo | gravações de checkpoint do `sdd-orquestrar-fluxo` (`references/estado-hil.md` dessa skill) | O estado da feature pelo mapeamento abaixo |
| Revisão delegada | `references/revisao-delegada.md` da skill `sdd-revisar-codigo`, Reservar | Feature `review`, `round` = `NN` de `codereview_NN` |
| Relatório recebido | a mesma referência, Receber | Feature: a próxima fase, como o fluxo roteia o status |
| Task selecionada | `sdd-orquestrar-tasks` passo 3, `sdd-executar-correcoes` passo 3 | Task `active` |
| Subtarefa marcada com evidência | `sdd-executar-task` passo 3 | Task `steps` `{ done, total }` |
| Task aprovada e movida | `sdd-orquestrar-tasks` passo 7, `sdd-executar-correcoes` | Task `done`, `link` para o caminho em `done/` |
| Task bloqueada | `sdd-orquestrar-tasks`, `sdd-executar-task`, `sdd-executar-correcoes` | Task `blocked`, `note` com o bloqueio em uma linha |
| Task reaberta | `sdd-orquestrar-tasks` passo 2 | Task `pending`, `link` para o caminho na raiz |
| Tasks de correção gravadas | `sdd-planejar-correcoes` | Cada task: `title`, `state: pending`, `group` `Review #N` (de `codereview_NN`), `link`, `steps` |

Este fluxo não tem etapa de QA; o estado `qa` não é usado.

## Mapeamento de estados

| Valor do checkpoint | `state` da feature |
| --- | --- |
| phase `produto`, `projeto-plano` | `planning` |
| phase `implementacao` | `active` |
| phase `revisao` | `review`, `round` = o número da revisão |
| phase `correcoes` | `fixing`, `round` = o número da revisão em correção |
| phase `aceite`, status `aguardando-hil` | `waiting` |
| status `bloqueado` | `blocked`, `note` com o bloqueio |
| phase e status `concluido` | `done` |
| status `pausado` | sem relatório |

Quando um status volta a `ativo`, informe de novo o estado da fase atual. As tasks usam só `pending`, `active`, `done` e `blocked`; as rodadas de revisão e correção pertencem à feature.

## Exemplos

Plano gravado:

```json
{
  "feature": { "id": "02-checkout", "title": "Checkout", "state": "planning" },
  "tasks": [
    { "id": "T01", "title": "Totais do carrinho", "state": "pending", "link": "tasks/prd-02-checkout/task_01.md", "steps": { "done": 0, "total": 4 } },
    { "id": "T02", "title": "Etapa de pagamento", "state": "pending", "link": "tasks/prd-02-checkout/task_02.md", "steps": { "done": 0, "total": 3 } }
  ]
}
```

Revisão 1 reprovada, correções planejadas:

```json
{
  "feature": { "id": "02-checkout", "title": "Checkout", "state": "fixing", "round": 1 },
  "tasks": [{ "id": "T08", "title": "Corrigir CR-01", "state": "pending", "group": "Review #1", "link": "tasks/prd-02-checkout/codereview_01/task_08.md" }]
}
```
