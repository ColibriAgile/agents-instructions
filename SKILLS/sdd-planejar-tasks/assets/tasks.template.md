# Plano de implementação — [nome da feature]

## Fontes estáveis

- PRD: `tasks/prd-[slug]/prd.md`
- TechSpec: `tasks/prd-[slug]/techspec.md`

> Ordem cache-first para cada execução: PRD → TechSpec → `task_[num].md`. Acrescente perguntas, logs, diffs e estado mutável somente depois desse prefixo.

## Premissas e pendências

- Premissa: [decisão necessária para interpretar as fontes]
- Pendente: [pergunta bloqueante, tarefas afetadas e responsável pela decisão]

## Grafo de dependências

| ID | Entrega | Depende de | Desbloqueia |
| --- | --- | --- | --- |
| T01 | [resultado observável] | — | T02 |

## Matriz de rastreabilidade

| ID de origem | Seção da fonte | Obrigação | Tarefas | Evidência ou teste |
| --- | --- | --- | --- | --- |
| RF1 | `prd.md#principais-funcionalidades` | [requisito] | T01 | [verificação] |
| TC-01 | `techspec.md#abordagem-de-testes` | [cenário] | T01 | [teste] |

## Tarefas

- [T01 — título](task_01.md): [resultado em uma frase].

## Gate de cobertura

- Cobertura: [pass/fail e lacunas]
- Rastreabilidade: [pass/fail e lacunas]
- Dependências: [pass/fail e lacunas]
- Atomicidade: [pass/fail e lacunas]
- Executabilidade: [pass/fail e lacunas]
- Cache-first: [pass/fail e lacunas]

## Estado

- [ ] T01 — pendente

## Problemas e soluções

- Nenhum.
