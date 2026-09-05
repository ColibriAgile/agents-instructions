# Plano de implementação — [nome da feature]

## Fontes estáveis

- PRD: `tasks/prd-[slug]/prd.md`
- TechSpec: `tasks/prd-[slug]/techspec.md`

> Fontes comuns antes da task e do estado mutável; ordem de leitura não garante cache hit.

## Grafo de dependências

| ID | Entrega | Depende de | Desbloqueia |
| --- | --- | --- | --- |
| T01 | [resultado observável] | — | T02 |

## Matriz de rastreabilidade

| ID de origem | Seção da fonte | Obrigação | Tarefas | Evidência ou teste |
| --- | --- | --- | --- | --- |
| RF-01 | `prd.md#requisitos-funcionais` | [requisito] | T01 | [verificação] |
| TC-01 | `techspec.md#abordagem-de-testes` | [cenário] | T01 | [teste] |

## Tarefas

- [T01 — título](task_01.md): [resultado em uma frase].

## Gate de cobertura

- Cobertura: [pass/fail e lacunas]
- Rastreabilidade: [pass/fail e lacunas]
- Dependências: [pass/fail e lacunas]
- Atomicidade: [pass/fail e lacunas]
- Executabilidade: [pass/fail e lacunas]
- Perfil de validação: [pass/fail, E2E omitido em desktop .NET, ambiente e lacunas]
- Idempotência: [pass/fail e lacunas]

## Premissas e pendências

- Premissa: [decisão necessária para interpretar as fontes]
- Pendente: [pergunta bloqueante, tarefas afetadas e responsável pela decisão]
- Ambiente necessário: [cenário, obrigação de origem, pré-requisito e autorização/pendência] | Nenhum.

## Estado

- [ ] T01 — pendente

## Problemas e soluções

- Nenhum.
