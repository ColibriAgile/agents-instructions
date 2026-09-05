# Contexto estável de execução

Carregue nesta ordem exata:

1. `tasks/prd-[slug]/prd.md`
2. `tasks/prd-[slug]/techspec.md`
3. Este arquivo

Use as versões atuais de PRD e TechSpec já carregadas; recupere somente fontes ausentes ou alteradas. Esta ordem não garante cache hit do host.

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
| RF-01 | `prd.md#requisitos-funcionais` | [requisito] |
| CMP-01 | `techspec.md#componentes-e-fluxo` | [decisão técnica] |

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
- Integração: [fronteira, ambiente e resultado esperado; dublê somente se representar o contrato]
- E2E: [omitido por política desktop .NET | fluxo pertinente de outro alvo]
- Manual: [roteiro, resultado esperado e responsável, se exigido pelo aceite]
- Comandos: `[comando de teste padrão do projeto]`
- Dependência de ambiente: [nenhuma | pré-requisito, autorização existente ou pendência]
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
- Estado validado: Pendente de execução (código/diff, configuração, projetos e ambiente).
- Pendências: Pendente de execução.

### Candidatas a ADR

Pendente de execução. `sdd-executar-task` substitui este texto por candidatas estruturadas ou por `Nenhuma — implementação direta da TechSpec ou decisão local`.
