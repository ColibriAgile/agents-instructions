# Revisão delegada

Protocolo para a sessão autora que chega à revisão e, em vez de encerrar a sessão, entrega `sdd-revisar-codigo` a um **revisor delegado**: um subagente de contexto novo, no mesmo worktree, que executa a skill inteira, grava o relatório e devolve. A independência da revisão vem do contexto, não da sessão: o revisor não herda conversa, raciocínio nem resumos do autor, e deriva das fontes o que julga. Por isso a delegação satisfaz a regra de independência da pausa de sessão, e o fluxo segue sem parada obrigatória.

## Elegibilidade

O host precisa lançar um subagente que:

- começa com **contexto novo**. Subagente que herda a conversa (no Claude Code, `fork`) carrega o enquadramento do autor e não é revisor;
- trabalha no **mesmo worktree**, porque a revisão julga o diff não commitado contra `--base`. Worktree isolado ou cópia do repositório não é elegível;
- lê e grava arquivos e roda comandos de build e teste. Explorador somente leitura (no Claude Code, `Explore`) não é elegível.

No Claude Code, o `Agent` com `subagent_type` de uso geral (`general-purpose`), sem `isolation`, atende; no Codex, um agente novo sem histórico. Preserve o modelo herdado. Sem subagente elegível, ou quando o usuário pediu revisão em sessão nova, siga a regra de independência como antes: pausa de sessão recomendando encerrar.

## Preparar

1. Delegue só com a etapa encerrada: todas as tasks do manifesto, ou da pasta da revisão em correções, concluídas. Com task pendente ou bloqueada, a revisão ainda não é o próximo passo e a pausa segue pelos destinos comuns. Conclua a unidade anterior: gravações persistidas, nenhum explorador ou processo em execução. Com o limiar de contexto atingido, grave antes o snapshot, e o checkpoint sob o fluxo, sem perguntar: o resultado da delegação e o relatório podem levar a sessão à zona em que o snapshot não pode mais ser gravado. Depois delegue mesmo assim, receba e faça a pausa por contexto com o próximo passo definido pelo status.
2. Reserve o próximo sufixo livre `codereview_[num]/` em `tasks/prd-[slug]/`, considerando todas as pastas existentes. Não crie a pasta.
3. Registre o estado do worktree para a conferência posterior: `git status --porcelain` e o `HEAD` atual.
4. Sob `sdd-orquestrar-fluxo`, grave o checkpoint com `phase: revisao`, `safe_to_stop: false` e `active_work` com `{kind: "revisor", handle, owner, scope: "codereview_[num]", state: "em-execucao"}`, preenchendo `handle` assim que o host o devolver.

## Instrução ao revisor

Envie só dados, em caminhos, nesta ordem:

- workspace absoluto, pasta da feature e slug;
- caminhos resolvidos de `sdd-revisar-codigo/SKILL.md` e de `references/TEMPLATE.md` dela, para o revisor não depender de descobrir skills;
- `--base` como commit resolvido (`git_base` do checkpoint ou a base registrada pelo chamador);
- a pasta reservada `codereview_[num]/` e, em re-revisão, o caminho da revisão anterior e a pasta das correções;
- com `snapshot-contexto.md` na pasta, o caminho de `references/carga.md` da skill `sdd-snapshot`;
- o contrato abaixo e o formato de retorno.

Não envie conversa, diffs que você analisou, resumos de handoff, justificativas, vereditos jev nem avaliação de prontidão ("está pronto", "falta só revisar"). O revisor lê handoffs como parte das fontes, pelas regras da skill.

### Contrato do revisor

- Execute `sdd-revisar-codigo` integralmente, na ordem dos passos, como sessão independente. Carregue o snapshot, se houver, pelo filtro de etapa independente de `references/carga.md` da skill `sdd-snapshot`.
- Grave somente `codereview_[num]/codereview.md` na pasta reservada. Não leia `jev-log.jsonl` nem chame o jev: com jev em `sombra` ou `ativo`, esta revisão é o grupo de controle do ponto `J3`.
- Pode rodar build, testes e comandos do perfil de qualidade que a revisão exige, mesmo os que escrevem em `bin/`, `obj/` ou fixtures. Não edita código, tasks, manifesto, handoffs, `workflow.md`, checkpoint nem snapshot, e não faz commit, stash, checkout ou limpeza no worktree.
- Não pergunta ao usuário e não faz pausa de sessão. Fonte ausente, ambiente indisponível ou dúvida viram limitação ou bloqueio no relatório, inclusive o que a skill mandaria registrar em `workflow.md`.
- Não delega a outro revisor. Explorador somente leitura só se o host permitir a este subagente; sem isso, buscas diretas.
- Retorne: caminho do relatório, status literal e uma linha por bloqueio ou limitação. Nada além disso.

## Enquanto o revisor roda

A sessão autora não grava nada no repositório nem roda build ou teste: qualquer mudança durante a revisão invalida a parte afetada. Aguarde o estado terminal pelo handle; timeout de observação não significa término.

## Receber

1. Com o estado terminal confirmado, atualize `active_work` e confira o worktree contra o registrado em Preparar. São esperados a pasta `codereview_[num]/` e saídas de build, testes e fixtures dos comandos que o relatório registra. Mudança em código, tasks, manifesto, handoffs, `workflow.md`, checkpoint, snapshot ou outro artefato SDD, ou em arquivo que nenhum comando registrado explica, é revisão contaminada: não a use como evidência nem reverta por conta própria; registre em `workflow.md`, ou no handoff em uso avulso, e leve ao **HIL de exceção** com os caminhos.
2. Leia `codereview_[num]/codereview.md` do disco. O retorno do subagente é pista; o relatório é a fonte. Confira que o status é exatamente `APROVADO`, `APROVADO COM RESSALVAS` ou `REPROVADO` e que o relatório registra `Execução: revisor delegado`.
3. Sem relatório, com relatório incompleto ou com status irreconhecível, delegue uma única vez de novo, a um revisor novo, reservando o próximo sufixo e registrando a pasta incompleta como interrompida, sem apagá-la. Persistindo a falha, siga a regra de independência como sem subagente elegível.
4. Grave o status e o caminho onde o chamador guarda o resultado da revisão (`review_status` e `sources.review` sob o fluxo) e siga o destino do chamador.

A sessão autora não reabre a revisão nem ajusta seu status: discordância com um achado vai para `sdd-planejar-correcoes` como item pendente ou ao usuário. Cada rodada usa um revisor novo, inclusive na re-revisão após correções.
