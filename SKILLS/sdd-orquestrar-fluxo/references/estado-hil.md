# Estado e decisões humanas

## Memória em disco

Use `tasks/prd-[slug]/checkpoint.json` como único índice operacional de retomada. `workflow.md` guarda decisões humanas, autorizações e eventos de recuperação com IDs estáveis; manifesto + tasks + handoffs continuam sendo autoridade da execução e relatórios preservam a história das revisões. `snapshot-contexto.md` leva decisões, aprendizados e ponteiros de código destilados entre sessões conforme `references/continuidade-sessao.md` da skill `sdd-orquestrar-tasks`. O checkpoint referencia essas fontes, sem copiar seus conteúdos.

Ao criar o primeiro checkpoint, leia integralmente [../assets/checkpoint.template.json](../assets/checkpoint.template.json). Preencha o template, sem criar PRD ou outros arquivos apenas para preencher caminhos. Campos de fonte inexistente ficam `null`; em execução, objetivo, feature, workspace e próxima ação são obrigatórios e não vazios.

| Campos | Contrato |
| --- | --- |
| `schema_version`, `generation` | Versão 1; geração cresce a cada gravação confirmada |
| `feature`, `workspace`, `owner_session` | Slug, diretório absoluto resolvido do repositório e ID real da sessão, ou `null` se indisponível |
| `phase` | `produto`, `projeto-plano`, `implementacao`, `revisao`, `correcoes`, `aceite` ou `concluido` |
| `status`, `safe_to_stop` | `ativo`, `aguardando-hil`, `pausado`, `bloqueado` ou `concluido`; seguro para troca somente sem gravações, exploradores ou processos pendentes e com persistência conferida |
| `objective`, `constraints` | Resultado pedido e invariantes curtos indispensáveis, incluindo política desktop .NET quando aplicável; detalhes por referência |
| `sources` | Caminhos relativos à pasta da feature, ou `null`, incluindo `snapshot` para `snapshot-contexto.md`; nenhum caminho de artefato fora dela |
| `review_status` | Status literal do último `codereview.md` (`APROVADO`, `APROVADO COM RESSALVAS`, `REPROVADO`), ou `null` antes da primeira revisão; `APROVADO` sem alteração posterior de código dispensa nova revisão |
| `approved_sources` | Itens `{path, sha256, decision_id}` ligando conteúdo aprovado à decisão humana em `workflow.md` |
| `decisions_to_read` | IDs de decisões relevantes à próxima ação; cada registro contém decisão, escopo, texto humano pertinente e proveniência disponível |
| `git_base`, `worktree_evidence` | Commit resolvido ou `null`; referência à evidência de alterações preexistentes/não commitadas no workflow ou handoff, pois HEAD sozinho não identifica o estado |
| `active_work` | Itens `{kind, handle, owner, scope, state}` de exploradores/processos reais; `handle: null` exige reconciliação, nunca presume término |
| `pending_hil`, `blockers` | Gate/pergunta/IDs afetados ou `null`; bloqueios por ID, resumo e referência de evidência |
| `correction_round`, `rounds_without_progress` | Contadores preservados entre sessões; rotação não reinicia limite de estagnação |
| `next_action` | Tipo `executar`, `validar`, `aguardar-decisao` ou `encerrar` (`delegar` em checkpoints antigos vale como `executar`), instrução curta e lista `read` de itens `{path, section}` com caminhos relativos ao workspace e seções necessárias |

Mantenha o índice preferencialmente abaixo de 8 KiB: mova detalhes para fontes referenciadas, sem truncar objetivo, restrições, bloqueios ou handles. Não grave conversas, PRD/TechSpec completos ou logs no JSON. Na retomada, o coordenador lê só o índice, decisões pertinentes e entradas do snapshot que casam; documentos técnicos são carregados quando sua etapa começa. O checkpoint é memória persistente até a retomada, não arquivo descartável do diretório temporário do sistema.

## Gravar e oferecer pausa

1. Atualize evidências e decisões no arquivo autoritativo antes de apontá-las no checkpoint. Grave antes de cada HIL, depois da resposta humana, ao reconciliar cada task e ao receber uma revisão. Durante trabalho ativo, registre os handles de exploradores e processos e `safe_to_stop: false`; uma interrupção abrupta recuperará esse estado conservador.
2. Antes de uma parada estratégica, deixe de iniciar novas unidades. Aguarde exploradores e processos terminarem e receba seus resultados; encerre contextos ociosos quando o host permitir. Se for necessário interromper trabalho, confirme término e registre o diff parcial e pendências antes de permitir retomada. Timeout ou handle inacessível não é confirmação de término.
3. Confira caminhos dentro da feature, versão, tipos, campos obrigatórios e referências. Grave `checkpoint.json.tmp` na mesma pasta, faça parse do JSON e confira os valores. Preserve a última versão válida em `checkpoint.previous.json`, substitua o arquivo principal por renomeação/substituição atômica suportada no ambiente e releia-o. Falha de escrita mantém a última versão válida e impede anunciar checkpoint pronto.
4. Com operações concluídas e gravação conferida, marque `safe_to_stop: true` e faça a pausa de sessão de `continuidade-sessao.md`: continuar, snapshot e continuar, snapshot e encerrar, ou encerrar. A regra de independência dela vale antes da revisão. Combine a escolha com HIL já necessário; entre tasks, pergunte somente sobre continuidade, sem repetir aprovação técnica. Gate e escolha de sessão são independentes: pausar não equivale a aprovar. Registre respostas e salve novamente; snapshot gravado entra em `sources.snapshot` e `next_action.read`. Silêncio mantém o gate/continuidade aguardando, sem iniciar nova unidade.
5. Se a escolha encerrar a sessão, grave `status: pausado`, preserve `pending_hil` se ainda não respondido e informe caminho e instrução de retomada: `Use $sdd-orquestrar-fluxo para retomar a feature <slug> neste repositório.` Encerre o turno sem novos exploradores ou processos. Se continuar, grave `ativo` e prossiga só com autorização válida; antes de gravar, atualize `safe_to_stop: false` e registre handles assim que exploradores ou processos iniciarem.

**Concluído quando:** checkpoint foi relido, fontes e próxima ação conferidas, nenhuma gravação, explorador ou processo permanece ativo numa pausa anunciada como segura. Não prometa evitar compactação ou troca automática de sessão; a pausa é escolhida pelo humano. A criação de checkpoint não significa conclusão da feature.

## HIL

| Gate | Material já preparado | Decisão necessária |
| --- | --- | --- |
| HIL 1 | PRD com escopo, aceite e premissas | Aprovar produto ou corrigir requisitos |
| HIL 2 | TechSpec, DAG, tasks, riscos e validações | Aprovar solução e execução, incluindo correções dentro do contrato |
| Exceção | Evidência, impacto e proposta concreta | Resolver desvio de escopo/arquitetura, ambiente indispensável, risco irreversível ou estagnação |
| Ressalvas | Resumo dos itens ressalvados na revisão, com impacto e esforço | Corrigir os itens escolhidos ou finalizar a feature |
| HIL 3 | Revisão final, testes, pendências e aceite manual | Aceitar entrega atual |

Use ferramenta de pergunta disponível ou pergunta textual. Pare só o trabalho dependente da resposta; silêncio, tempo decorrido ou conclusão de explorador não equivalem a consentimento. Explique qual gate falta e aponte os artefatos. Reuse autorização já dada para o mesmo escopo; não peça duas vezes para gravar um rascunho e depois executá-lo.

Se o usuário modificar explicitamente as paradas HIL, preserve sua instrução e registre o novo escopo de autonomia. Pendência de evidência continua pendente mesmo que o usuário aprove a solução. Aceite humano não substitui validação técnica obrigatória.

## Retomada e invalidação

1. Na invocação, com feature explícita leia só seu checkpoint. Sem feature, descubra apenas `tasks/prd-*/checkpoint.json` e leia metadados para selecionar o único não concluído. Com vários, pergunte qual retomar, oferecendo primeiro, entre checkpoints de mesmo prefixo, o próximo recorte pendente na ordem de dependência; checkpoint inválido é candidato a recuperar, não motivo para ignorar a feature. Com todos concluídos, reporte esse estado sem reiniciar trabalho. Sem checkpoint, reconcilie fontes existentes e `workflow.md` antes de criar o primeiro.
2. Valide JSON, versão, campos e workspace/feature. Preserve arquivo inválido; tente `checkpoint.previous.json` somente depois de validá-lo e reconciliá-lo com arquivos atuais. Se nenhuma versão for válida, reconstrua estado pela evidência disponível, mantendo autorizações incertas pendentes. Workspace diferente exige confirmar o destino, sem executar caminhos herdados.
3. Leia apenas o checkpoint, as decisões referidas e o snapshot conforme seu protocolo de carga; confira existência/hash das fontes sem carregar todo o conteúdo. Quando a próxima ação for uma revisão, carregue o snapshot como etapa independente. Consulte seções do manifesto/handoffs pertinentes à próxima ação. Valide handles e estado real de processos, inclusive em checkpoint supostamente seguro, se houver indício de outra sessão coordenadora. Coordenador ativo significa gravar ou executar trabalho, não apenas manter uma conversa antiga aberta e ociosa. Se houver gravação em curso em outro lugar ou término incerto, bloqueie novas escritas até reconciliar; nunca grave em paralelo com outro coordenador. Quando for o único coordenador, registre o novo dono; uma sessão antiga posteriormente reativada deve conferir esse dono antes de gravar.
4. Reuse artefatos e aprovações com conteúdo e proveniência correspondentes, sem perguntar tudo novamente. O registro da decisão humana preserva autorização anterior; texto produzido por agente, inclusive entradas do snapshot, não cria autorização nova. Aprovação inconsistente ou não verificável exige apenas a decisão afetada. `pausado` não impede retomada automática pela nova invocação; `pending_hil` continua exigindo resposta, e `concluido` apenas reporta resultado.
5. Alteração material no PRD invalida aprovação de produto e derivados afetados; mudança na TechSpec invalida plano/execução afetados; mudança no código invalida evidência de testes/revisão correspondentes. Preserve IDs e histórico. Novo escopo requer HIL; correção já autorizada exige revalidação técnica, sem reiniciar gates humanos válidos.
6. Em movimento interrompido de task, reconcilie origem/destino, revisão e handoff antes de corrigir link/estado. Preserve contratos concluídos e relatórios. Conclusão incorreta comprovada exige reabertura pelo dono do DAG conforme `sdd-orquestrar-tasks`: preserve evidência anterior em `Problemas e soluções`, mova à raiz e atualize link/estado, mantendo IDs e contrato. Registre vínculo com correção; só conclua novamente após revisão da evidência atual e dos dependentes afetados.
7. Recalcule a próxima ação a partir da primeira evidência inválida/ausente; nem a instrução salva nem o próximo passo do snapshot prevalecem sobre arquivos atuais ou pedido novo. Resuma fase e próximo passo em uma linha e prossiga sem carregar histórico inteiro. Ao finalizar, confira todas as obrigações, tasks/correções, evidência integrada, HIL 3 e ausência de validação essencial pendente; grave `phase/status: concluido`, `next_action.kind: encerrar`, marque o snapshot `encerrado` e preserve o checkpoint para consulta.

**Concluído quando:** próxima ação tem fonte atual, autorização correspondente e único coordenador; ou a recuperação aponta a evidência/decisão específica que falta. O checkpoint acelera a retomada, mas não substitui contratos nem comprova sozinho sucesso técnico.
