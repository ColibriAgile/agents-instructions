# Relatório de code review — [nome da feature]

## Resumo

- Status: APROVADO / APROVADO COM RESSALVAS / REPROVADO
- Escopo Git: `[base..estado atual]` ou `Não delimitado — ver limitações`
- Revisão anterior: `[caminho ou —]`

## Fontes e escopo

| Fonte | Caminho ou referência | Estado |
| --- | --- | --- |
| PRD | `tasks/prd-[slug]/prd.md` | lido |
| TechSpec | `tasks/prd-[slug]/techspec.md` | lido |
| Manifesto | `tasks/prd-[slug]/tasks.md` | lido |
| Implementação | `[diff, handoffs e arquivos]` | [delimitado/limitado] |

## Matriz de cobertura

| Origem | Obrigação | Implementação | Teste | Estado | Evidência |
| --- | --- | --- | --- | --- | --- |
| RF-01 | [requisito] | `[arquivo:símbolo]` | `[teste]` | conforme/não conforme/pendente/não verificável | [evidência] |

## Conformidade com rules e skills

| Regra ou skill | Estado | Evidência |
| --- | --- | --- |
| [nome] | OK/NOK/N/A | `[arquivo:linha ou comando]` |

## Aderência à TechSpec

| Decisão ou contrato | Estado | Evidência |
| --- | --- | --- |
| [origem] | SIM/NÃO/PARCIAL | [evidência] |

## Tasks verificadas

| Task | Localização | Estado | Handoff e evidência |
| --- | --- | --- | --- |
| T01 | `done/task_01.md` | COMPLETA/INCOMPLETA | [resumo] |

## Validações executadas

- Perfil e exclusões: [stack por alvo; E2E omitido por política desktop .NET, quando aplicável]
- Estado validado: [código/diff, configuração, projetos e ambiente]
- Evidência reaproveitada: [handoff/relatório e razão de ainda ser válido | nenhuma]
- Aceite manual: [evidência ou pendência, quando essencial]

| Comando | Resultado | Obrigações cobertas |
| --- | --- | --- |
| `[comando]` | passou/falhou/bloqueado | [IDs] |

## Achados

| ID | Severidade | Origem | Evidência | Impacto | Recomendação comprovada |
| --- | --- | --- | --- | --- | --- |
| CR-01 | Crítica/Alta/Média/Baixa | [ID ou regra] | `[arquivo:linha]` — [fato] | [efeito] | [ação ou `Causa ainda pendente`] |

## Achados anteriores (somente em re-revisão)

| Revisão/ID | Estado | Evidência atual |
| --- | --- | --- |
| codereview_[anterior]/CR-01 | resolvido/persistente/não verificável | [arquivo/teste ou limitação] |

## Limitações e pendências

- [evidência indisponível, impacto no status e decisão necessária]

## Conclusão

[Parecer derivado da matriz, dos achados e das validações.]
