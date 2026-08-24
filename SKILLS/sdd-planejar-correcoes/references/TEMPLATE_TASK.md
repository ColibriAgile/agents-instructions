# Contexto estável de execução

Carregue nesta ordem exata:

1. `tasks/prd-[slug]/codereview_[num]/codereview.md`
2. Este arquivo

Use o relatório como fonte de verdade. Recupere TechSpec, rules, skills e código somente quando apontados abaixo. Coloque perguntas, ferramentas, diffs e estado depois desse prefixo.

---

# TXX — [título orientado ao resultado]

## Resultado

[Comportamento observável corrigido ao concluir a task.]

## Dependências e limites

- Depende de: [IDs ou —]
- Desbloqueia: [IDs ou —]
- Dentro do escopo: [mudanças desta correção]
- Fora do escopo: [limites relevantes]

## Rastreabilidade

| Origem | Seção | Achado coberto |
| --- | --- | --- |
| CR-01 | `codereview.md#[seção]` | [não conformidade] |

## Requisitos

- [Comportamento esperado pelo review ou pela TechSpec]
- [Regra e condição de erro ou borda]

## Contexto a recuperar sob demanda

- TechSpec: `[seção, se aplicável]`
- Rules/skills: [nomes]
- Código: `[arquivo ou símbolo]` — [relevância]

## Trabalho

- [ ] TXX.1 [mudança pequena e verificável]
- [ ] TXX.2 [mudança pequena e verificável]

## Critérios de aceite

- [Condição observável e mensurável]
- [Não conformidade eliminada sem regressão]

## Verificação

- Unitário: [cenário e resultado, se aplicável]
- Integração: [fronteira e resultado, se aplicável]
- E2E: [fluxo crítico, se aplicável]
- Comandos: `[comando real]`
- Evidência esperada: [saída, teste, métrica ou artefato]

## Arquivos afetados

- Modificar: `[caminho]`
- Criar: `[caminho, se necessário]`

## Observabilidade e recuperação

- Sinal operacional: [log, métrica ou health check, se aplicável]
- Recuperação: [rollback ou reversão, se aplicável]

## Handoff

> Atualizado por `sdd-executar-correcoes` durante a implementação.

- Resultado produzido: Pendente de execução.
- Arquivos alterados: Pendente de execução.
- Verificações: Pendente de execução.
- Pendências: Pendente de execução.
