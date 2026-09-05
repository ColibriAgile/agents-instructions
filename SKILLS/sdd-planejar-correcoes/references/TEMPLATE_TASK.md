# Contexto estável de execução

Carregue nesta ordem exata:

1. `tasks/prd-[slug]/codereview_[num]/codereview.md`
2. Este arquivo

Use a versão do relatório já carregada; recupere contratos e código pertinentes depois. Esta ordem não garante cache hit do host.

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
| codereview_[num]/CR-01 | `codereview.md#[seção]` | [não conformidade] |

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
- E2E: [omitido por política desktop .NET | fluxo pertinente de outro alvo]
- Manual: [roteiro, resultado esperado e responsável, se exigido pelo aceite]
- Dependência de ambiente: [nenhuma | pré-requisito, autorização existente ou pendência]
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
- Estado validado: Pendente de execução (código/diff, configuração, projetos e ambiente).
- Pendências: Pendente de execução.
