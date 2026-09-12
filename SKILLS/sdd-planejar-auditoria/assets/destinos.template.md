# Destinos da auditoria — [projeto]

## Fonte

- Relatório: `.audits/architectural-analysis-[timestamp].md` (imutável)
- Código conferido em: [commit resolvido e mudanças preexistentes]

## Frentes

| Ordem | Slug | Resultado | Achados | Rota | Depende de | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | [`arq-[AAAAMMDD]-01-[frente]`](../tasks/prd-arq-[AAAAMMDD]-01-[frente]/tasks.md) | [resultado revisável] | AA-01, AA-02 | refatoração / defeito / reutilizada | — | proposta / aprovada / adiada / contratos / planejada / bloqueada |

## Achados

| ID | Dimensão | Local | Achado | Classe | Evidência atual | Destino |
| --- | --- | --- | --- | --- | --- | --- |
| AA-01 | [código morto / duplicação / anti-padrão / tipos e nulidade / smell] | `[arquivo:linha]` | [resumo e recomendação do relatório] | acionável / resolvido / descartado / pendente | [comando ou trecho conferido] | [`slug` T01, T02 / resolvido / descartado / pendente / adiada] |

## Pendências

- [AA-NN]: [decisão ou ambiente necessário, responsável e frente afetada] | Nenhuma.

## Execução

1. `sdd-orquestrar-tasks --prd [slug da frente 1]`
2. [próxima frente elegível pela coluna Depende de]
