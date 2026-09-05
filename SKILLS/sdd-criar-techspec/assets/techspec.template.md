# TechSpec — [nome da feature]

## Fontes e rastreabilidade

- PRD: `tasks/prd-[slug]/prd.md`
- Instruções e skills aplicáveis: [nomes]
- Evidência no código existente: [caminhos e símbolos]

## Resumo da solução

[Abordagem e limites em até dois parágrafos.]

## Decisões técnicas

| ID | Obrigações do PRD | Decisão | Razão e evidência | Alternativas e trade-offs |
| --- | --- | --- | --- | --- |
| DEC-01 | RF-01, RNF-01 | [decisão] | [evidência] | [alternativas] |

## Componentes e fluxo

| ID | Componente | Novo ou modificado | Responsabilidade | Dependências |
| --- | --- | --- | --- | --- |
| CMP-01 | `[nome/caminho]` | [estado] | [função] | [IDs] |

[Descreva o fluxo entre componentes sem transcrever o código.]

## Contratos e dados

[Inclua somente contratos alterados. Para cada um, documente campos, tipos, obrigatoriedade, validação, compatibilidade e exemplos necessários. Remova a seção se não se aplicar.]

## Integrações e interfaces

[Inclua somente endpoints, eventos, UI, arquivos, banco ou serviços afetados. Documente entrada, saída, erros, autenticação, timeout e idempotência aplicáveis.]

## Erros, segurança e recuperação

- Erros e bordas: [comportamento]
- Autorização e dados sensíveis: [controle, se aplicável]
- Concorrência e idempotência: [garantia, se aplicável]
- Rollback ou reversão: [procedimento]

## Sequenciamento

| Etapa | Depende de | Resultado verificável |
| --- | --- | --- |
| [etapa] | [IDs ou —] | [evidência] |

## Abordagem de testes

- Perfil: [stack por projeto e evidência, SDK/TFM, runner e rota de execução]
- E2E: [omitido por política desktop .NET | cenário pertinente para outro alvo]
- Pré-requisitos e exclusões dos comandos: [ambiente, filtros/projetos sem E2E desktop]
- Aceite manual: [roteiro, resultado esperado e responsável, quando necessário]

| ID | Obrigações | Nível | Cenário | Resultado esperado | Comando ou projeto |
| --- | --- | --- | --- | --- | --- |
| TC-01 | RF-01 | [nível permitido pelo perfil] | [cenário] | [resultado] | `[comando ou roteiro]` |

## Observabilidade e rollout

- Sinais: [logs, métricas ou health checks aplicáveis]
- Migração e compatibilidade: [estratégia, se aplicável]
- Rollout e rollback: [etapas e gates]

## Riscos e pendências

- Risco: [probabilidade, impacto e mitigação]
- Pendente: [decisão, responsável e itens afetados]

## Arquivos relevantes

- Modificar: `[caminho]`
- Criar: `[caminho, se necessário]`
