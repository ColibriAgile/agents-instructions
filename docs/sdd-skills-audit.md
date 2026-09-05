# Auditoria das skills SDD

Foram revisadas as nove skills existentes em `SKILLS/sdd-*`, seus templates, referências e políticas de invocação. Foi adicionada `sdd-orquestrar-fluxo` ao bundle `sdd`. Nenhuma instalação global, publicação ou mudança de política de invocação existente foi realizada.

## Medição estática

Medição histórica da primeira otimização, anterior à extensão de checkpoints descrita ao final, comparada com `HEAD` usando bytes UTF-8 e normalização de CRLF para LF. Não é contagem de tokens nem medição de latência/cache; os valores não representam o tamanho após essa extensão.

| SKILL.md existente | Antes | Depois |
| --- | ---: | ---: |
| sdd-criar-prd | 2.894 | 1.956 |
| sdd-criar-techspec | 3.429 | 2.372 |
| sdd-executar-correcoes | 4.659 | 3.340 |
| sdd-executar-task | 4.775 | 2.981 |
| sdd-orquestrar-tasks | 4.724 | 3.559 |
| sdd-planejar-correcoes | 5.613 | 2.730 |
| sdd-planejar-refatoracao | 3.609 | 2.571 |
| sdd-planejar-tasks | 7.999 | 3.214 |
| sdd-revisar-codigo | 4.906 | 3.440 |
| Total | 42.608 | 26.163 |

Redução de **38,6% nos nove arquivos principais**. O pacote completo, incluindo templates, políticas, nova orquestradora e referências, passou de 57.725 para 59.308 bytes (+2,7%). O ganho de contexto vem de carregar somente a etapa e referências pertinentes, evitar histórico integral nos subagentes e reaproveitar evidência válida; não de reduzir indiscriminadamente todos os arquivos do pacote.

Cache hit e custo real não foram medidos. A separação entre prefixo estável e dados variáveis segue o mecanismo documentado em [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching). O host pode inserir mensagens variáveis antes das leituras, portanto ordem de arquivos não garante correspondência do prefixo.

## Evidências por requisito

| Requisito | Evidência no resultado |
| --- | --- |
| Revisar todas as skills SDD | Nove entrypoints reescritos, templates e referências inspecionados; nomes preservados |
| Reduzir contexto e trabalho repetido | Leitura uma vez por versão, metadados antes de detalhe, fontes por caminho, handoff único e reutilização de validação do mesmo estado |
| Melhorar condições de cache | `sdd-orquestrar-fluxo/references/delegacao.md` distingue prefixo real, configuração estável e cauda variável; não promete cache hit |
| PRD até revisão e correções | Seis fases e tabela de roteamento da nova orquestradora; revisão independente após cada conjunto de correções |
| Subagentes | Contratos explícitos, escopos exclusivos, slots reais, fallback de profundidade e handles verificados antes de reiniciar |
| HIL estratégico | PRD, TechSpec/plano, exceção e aceite; artefatos gerados antes da decisão e autorizações reaproveitadas |
| Desktop C#/.NET sem E2E | Perfil técnico, planejadores, executores, revisores e templates incluem omissão; comandos agregados também devem excluir E2E |
| Preservar aceite | Unitários/integração pertinentes e roteiro manual; evidência manual essencial ausente impede aprovação |
| Retomada e correções completas | `workflow.md`, invalidação por conteúdo, reabertura de conclusão incorreta e revalidação de dependentes |
| Integração no catálogo | Bundle `sdd` corresponde exatamente às dez pastas atuais; políticas existentes preservadas |

## Verificações executadas

- `validate-metadata.py` executado para as dez skills: nomes e descrições válidos.
- YAML lido e campos conferidos, nomes correspondem às pastas, corpos abaixo de 500 linhas, links locais existentes e recursos alcançáveis. As seis políticas explícitas anteriores permanecem consistentes entre frontmatter e `agents/openai.yaml`.
- `quick_validate.py` passou para a nova orquestradora. Seu esquema estrito rejeita `argument-hint`; esse campo foi removido apenas da nova skill. As extensões existentes (`argument-hint`, `disable-model-invocation`) foram preservadas e verificadas separadamente, sem afirmar que esse validador estrito aceita os entrypoints antigos.
- `git diff --check` sem erro. Busca restrita confirmou remoção de `AskUserQuestion`, aprovações anteriores à redação e âncoras/IDs legados incorretos.
- Revisão independente por subagente das nove skills, templates e instalador; simulação estática de três cenários abaixo. Não houve execução de uma aplicação .NET ou benchmark de um fluxo real.

| Cenário simulado | Resultado prescrito verificado |
| --- | --- |
| Nova feature WPF, usuário autorizou só planejamento | Produz PRD e gates de planejamento; não inicia código sem autorização do HIL 2 |
| Retomada com tasks em done, manual essencial ausente e review reprovado | Mantém evidência pendente; reabre conclusão incorreta pelo dono do DAG; não aprova por localização de arquivo |
| Correções autorizadas, solução desktop + API, executor vivo após timeout | Exclui E2E apenas dos alvos desktop; preserva testes pertinentes da API; consulta handle sem duplicar escritor; emite uma nova revisão pelo coordenador |

A simulação encontrou duas ambiguidades, ambas corrigidas e reconferidas pelo revisor: faltava transição explícita de reabertura de task; o template sugeria dublê para qualquer integração. O protocolo agora preserva evidência anterior e o template exige que o mecanismo represente o contrato.

## Checklist de autoria, item a item

Aplicação de `writing-skills/references/checklist.md` às dez skills e recursos. As extensões de host já presentes são preservadas conforme `skill-creator`; `agents/` é metadado do host, não referência de contexto a carregar. Itens de scripts são satisfeitos por ausência de scripts novos no pacote.

| Item | Resultado e evidência |
| --- | --- |
| A1 Invocação justificada | Pass: políticas anteriores preservadas; nova orquestradora descoberta pelo pedido de fluxo completo e dependências invocadas explicitamente |
| A1 Conceito no início | Pass: descrições começam com PRD, TechSpec, Tasks, Execução, DAG, Revisão, Correções, Refatoração ou Fluxo |
| A1 Um gatilho por ramo | Pass: criação/atualização ou etapa específica sem listas de sinônimos |
| A1 Descrição de gatilhos | Pass: etapa e limite de aplicação, sem procedimento no frontmatter |
| A2 Conteúdo tipado | Pass: passos numerados com saída verificável; regras condicionais em referências |
| A2 Critérios de conclusão | Pass: cada passo termina em Saída; cobertura e evidência exigidas para todas as obrigações |
| A2 Divulgação por ramo | Pass: perfil .NET somente na TechSpec C#; WinForms/DevExpress somente no alvo; referências de coordenação somente na orquestradora |
| A2 Ponteiros condicionais | Pass: leitura integral explícita ao redigir templates ou entrar no ramo correspondente |
| A2 Co-localização | Pass: budget, decisões/falhas, status, delegação e HIL em blocos próprios; protocolo de checkpoint em estado-hil.md |
| A3 Fonte única | Pass: detalhes técnicos na TechSpec, DAG no manifesto, histórico nos reviews; checkpoint é índice operacional e workflow guarda decisões; repetições de E2E são guardrails curtos para uso avulso |
| A3 Relevância | Pass: removidas cerimônia repetida e seções de relatório sem efeito no parecer |
| A3 No-ops | Pass: revisão sentença a sentença removeu reforços genéricos e gates redundantes; redução estática discriminada acima |
| A3 Negação | Pass: proibições remanescentes protegem escopo, evidência, E2E e histórico, com ação alternativa prescrita |
| A3 Termos compactos | Pass: DAG, handoff, HIL e IDs usados consistentemente sem repetir definições extensas |
| B1 Nome | Pass: validador executado; nomes únicos, formato válido e correspondência com diretório |
| B1 Tamanho da descrição | Pass: dez descrições abaixo de 1.024 caracteres |
| B1 Cobertura de gatilhos | Pass: cada descrição define quando usar e fronteira com etapa avulsa ou adjacente |
| B1 Terceira pessoa | Pass: descrições sem pronomes pessoais; validador executado |
| B2 Estrutura | Pass: assets/references planos; agents/openai.yaml existente preservado como extensão admitida pelo skill-creator |
| B2 Documentação humana externa | Pass: auditoria em docs/, nenhum README/CHANGELOG adicionado às skills |
| B2 Barras de caminho | Pass: caminhos nas instruções usam / |
| B2 Helpers explícitos | Pass: nenhum helper executável novo ou chamada ambígua a script no pacote |
| B2 Sem órfãos | Pass: todos os assets/references alcançáveis pelo entrypoint; template JSON alcançado por estado-hil.md; agents/openai.yaml descoberto pelo host |
| B3 Corpo enxuto | Pass: dez entrypoints abaixo de 500 linhas; nove existentes menores |
| B3 Imperativo | Pass: passos usam Resolva, Leia, Confira, Delegue e Grave |
| B3 Vocabulário do domínio | Pass: PRD/TechSpec/DAG/CR/runner/TFM consistentes; sem mudança de stack presumida |
| B3 CLI | Pass: nenhum script novo necessário; validação utilizou helpers existentes |
| B3 Papel de helpers | Pass: nenhum helper empacotado a rotular; comandos de produto são especificados pelo repositório alvo |
| B3 Falhas | Pass: ausência de fontes, conflitos, validação indisponível, processos vivos e estagnação têm encaminhamento concreto |

Critérios visuais da skill antislop não se aplicam: esta entrega contém instruções e templates Markdown, sem interface. Não foram adicionadas afirmações de desempenho medido, evidências fictícias ou publicação automática.

## Extensão: checkpoints e troca manual de sessão

Pedido posterior: permitir pausa escolhida pelo humano e retomada automática ao invocar a orquestradora numa sessão nova. O checklist acima foi reaplicado item a item à extensão; fonte única, co-localização e alcançabilidade foram atualizadas para os novos arquivos.

- `checkpoint.json` é o índice operacional versionado; `workflow.md` preserva decisões com proveniência. Template JSON inclui fase, dono, fontes, hashes aprovados, handles, HIL pendente, contadores de correção e próxima ação.
- Leitura inicial limitada ao índice e decisões pertinentes; fontes técnicas consultadas por demanda. Sem slug, checkpoint pendente único é selecionado; múltiplos exigem escolha.
- Gravação conferida antes/depois de HIL, entre lotes e após revisão; arquivo temporário na mesma pasta, versão anterior válida preservada e substituição atômica quando suportada. O checkpoint de runtime só será criado ao executar a skill numa feature real.
- Pausa segura exige trabalho estabilizado e ausência de escritores ativos. A escolha de pausar não aprova HIL. Sessão antiga aberta e ociosa não é considerada escritor; ao ser reativada, deve conferir o dono registrado.
- Chamada limitada a lote nas duas skills executoras devolve controle sem avançar o DAG. O último lote executa validação integrada antes do retorno; bloqueios são diferenciados de lote aprovado.

Verificação estrutural: `quick_validate.py`, `validate-metadata.py`, parse do template JSON, links locais em entrypoint/referências e `git diff --check` passaram. Não houve execução de uma troca real de sessões ou teste de atomicidade do filesystem; trata-se de protocolo prescrito por skill, sem automação de troca do host.

| Simulação independente | Evidência de comportamento prescrito |
| --- | --- |
| Pausar antes de aprovar HIL | `pending_hil` é preservado; retomada exige a decisão afetada |
| Pausar após lote com tasks restantes | Manifesto preserva pendentes; checkpoint registra próxima ação sem concluir feature |
| Nova sessão sem slug | Um checkpoint pendente é retomado; dois exigem seleção por metadados |
| Interrupção com escritor vivo | Retomada bloqueia novas escritas até verificar/reconciliar término |
| JSON inválido | Arquivo preservado; versão anterior validada contra estado real; autorizações incertas permanecem pendentes |
| Último lote | Regra corrigida após revisão: validação integrada ocorre antes do retorno final |

A revisão também distinguiu coordenador executando de conversa antiga ociosa, evitando bloquear indevidamente uma troca já preparada. Esses ajustes preservam os gates técnicos, a omissão de E2E desktop .NET e as autorizações anteriores verificáveis.
