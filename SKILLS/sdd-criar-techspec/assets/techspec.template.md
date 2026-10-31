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
| DEC-01 | RF-01, RNF-01 | [decisão] | [evidência] | [alternativas; no nível `sdd-egm`, só os trade-offs da escolha, com as rejeitadas em `Alternativas descartadas`] |

## Alternativas descartadas

[Exclusiva do nível `sdd-egm`; remova nos demais. Registra o que foi rejeitado para que uma sessão futura não proponha de novo. `ADR: sim` quando a decisão governa contrato, fronteira ou atributo de qualidade e deve sobreviver à remoção dos artefatos.]

| DEC | Alternativa | Prós | Contras | Motivo da rejeição | ADR |
| --- | --- | --- | --- | --- | --- |
| DEC-01 | [opção rejeitada] | [benefícios] | [custos] | [motivo concreto] | sim/não |

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

## Perfil de qualidade

Regras que esta feature pode violar. Bloqueante impede conclusão da task e reprova a revisão; ressalva vira melhoria opcional e conta para o escalonamento. Hit coberto por `DEC-NN` é esperado, não achado.

| ID | Regra | Classe | Comando de verificação | Justificativa prévia |
| --- | --- | --- | --- | --- |
| QA-01 | [regra] | bloqueante/ressalva | `[comando rg escopado ao diff]` | `DEC-NN` ou — |

- Escopo da verificação: [arquivos do diff da task]
- Gatilho de escalonamento: [8+ ressalvas, arquivo acima de 500 linhas, ou duplicação em 3+ pontos]

### Baseline do terreno

Hits que já existiam nos arquivos alvo antes da implementação. Hit listado aqui não é achado da task; hit novo é. Arquivo alvo sem linha nesta tabela conta como não medido, e todo hit nele será tratado como novo.

| Arquivo | Linhas | Membros públicos | Deps no construtor | Casos | Hits pré-existentes | Destino |
| --- | --- | --- | --- | --- | --- | --- |
| `[caminho]` | [n] | [n] | [n] | [n] | `QA-NN: arquivo:linha` | registrado / absorvido em `DEC-NN` / refatoração prévia |

- Refatoração preparatória: [não recomendada | recomendada — escopo mínimo, razão e o que ela torna fácil]

## Observabilidade e rollout

- Sinais: [logs, métricas ou health checks aplicáveis]
- Migração e compatibilidade: [estratégia, se aplicável]
- Rollout e rollback: [etapas e gates]

## Riscos e pendências

- Risco: [probabilidade, impacto e mitigação]
- Pendente: [decisão, responsável e itens afetados]

## Arquivos relevantes

[No nível `sdd-egm`, substituída por `Plano de implementação detalhado`.]

- Modificar: `[caminho]`
- Criar: `[caminho, se necessário]`

## Plano de implementação detalhado

[Exclusiva do nível `sdd-egm`. Todo arquivo de produção, teste, configuração, schema ou script que a feature cria, modifica ou exclui. Sem código: assinaturas, pseudocódigo e schemas são permitidos. Quem implementa não toma decisão de design.]

| Arquivo | Operação | Mudança | Motivo | Origem |
| --- | --- | --- | --- | --- |
| `[caminho]` | Criar / Modificar / Excluir | [tipos, assinaturas, regras, casos de teste] | [por que esta mudança é necessária] | [CMP, DEC, TC] |
