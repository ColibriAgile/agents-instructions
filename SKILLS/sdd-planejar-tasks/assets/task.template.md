# Contexto estável de execução

Carregue nesta ordem exata:

1. `tasks/prd-[slug]/prd.md`
2. `tasks/prd-[slug]/techspec.md`
3. Este arquivo

Use PRD e TechSpec como fontes de verdade. Coloque perguntas, resultados de ferramentas, diffs e atualizações de estado depois desse prefixo.

---

# TXX — [título orientado ao resultado]

## Resultado

[Comportamento observável entregue ao concluir a tarefa.]

## Dependências e limites

- Depende de: [IDs ou —]
- Desbloqueia: [IDs ou —]
- Dentro do escopo: [mudanças desta entrega]
- Fora do escopo: [limites relevantes]

## Rastreabilidade

| Origem | Seção | Obrigação coberta |
| --- | --- | --- |
| RF1 | `prd.md#principais-funcionalidades` | [requisito] |
| CMP-01 | `techspec.md#visao-dos-componentes` | [decisão técnica] |

## Contexto a recuperar sob demanda

- Skills aplicáveis: [nomes registrados na TechSpec]
- Código existente: `[arquivo ou módulo]` — [por que é relevante]
- Contrato ou integração: `[seção da TechSpec]`

## Trabalho

- [ ] TXX.1 [mudança pequena e verificável]
- [ ] TXX.2 [mudança pequena e verificável]

## Critérios de aceite

- [Condição observável e mensurável]
- [Comportamento de erro ou borda]

## Verificação

- Unitário: [cenário e resultado esperado]
- Integração: [fronteira e resultado esperado]
- E2E: [fluxo crítico, se aplicável]
- Comandos: `[comando real do projeto]`
- Evidência esperada: [saída, teste, métrica ou artefato]

## Arquivos afetados

- Modificar: `[caminho]`
- Criar: `[caminho, se necessário]`

## Observabilidade e recuperação

- Sinal operacional: [log, métrica ou health check, se aplicável]
- Recuperação: [rollback ou reversão, se aplicável]

## Handoff

> Atualizado por `sdd-executar-task` durante a implementação.

- Resultado produzido: Pendente de execução.
- Arquivos alterados: Pendente de execução.
- Verificações: Pendente de execução.
- Pendências: Pendente de execução.

### Candidatas a ADR

Pendente de execução. `sdd-executar-task` substitui este texto por candidatas estruturadas ou por `Nenhuma — implementação direta da TechSpec ou decisão local`.
