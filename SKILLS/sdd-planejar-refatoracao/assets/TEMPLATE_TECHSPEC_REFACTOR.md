# TechSpec — Refatoração de [alvo]

## Fontes e rastreabilidade

- PRD: `prd.md`
- Código e testes atuais: [caminhos]
- Instruções e skills aplicáveis: [nomes]

## Decisões técnicas

| ID | Requisitos | Decisão | Evidência e razão | Alternativas e trade-offs |
| --- | --- | --- | --- | --- |
| DEC-01 | R-01 | [decisão] | [evidência] | [alternativas] |

## Componentes afetados

| ID | Componente | Estado atual | Mudança permitida | Risco e dependências |
| --- | --- | --- | --- | --- |
| CMP-01 | `[nome/caminho]` | [responsabilidade] | [mudança] | [risco/IDs] |

## Rede de segurança

- Perfil: [stack por projeto e evidência, SDK/TFM, runner e comandos existentes]
- E2E: [omitido por política desktop .NET | cenário pertinente para outro alvo]
- Pré-requisitos e exclusões dos comandos: [ambiente e projetos/filtros sem E2E desktop]
- Aceite manual: [roteiro, resultado esperado e responsável, quando necessário]

| ID | Requisito | Nível | Cenário | Resultado esperado | Comando ou roteiro |
| --- | --- | --- | --- | --- | --- |
| TC-01 | R-01 | [nível permitido pelo perfil] | [cenário] | [resultado] | `[verificação]` |

## Sequenciamento por dependência

| Etapa | Depende de | Mudança | Evidência para avançar | Reversão |
| --- | --- | --- | --- | --- |
| [etapa] | [IDs ou —] | [ação] | [gate] | [procedimento] |

## Compatibilidade e rollout

- Contratos preservados: [IDs]
- Migração ou coexistência: [se aplicável]
- Observabilidade: [sinal de regressão]
- Rollback: [procedimento]

## Riscos e pendências

- Risco: [probabilidade, impacto e mitigação]
- Pendente: [decisão e itens afetados]
