---
name: sdd-explorar-conceito
description: Fase Elefante SDD que amadurece uma feature num brief antes do PRD. Use no nível sdd-egm de sdd-orquestrar-fluxo, antes de redigir o PRD, ou quando pedirem um brief de conceito para especificar depois em SDD. Não use para só estressar uma ideia sem especificá-la (grilling), para redigir PRD ou TechSpec, nem para revisar artefatos já escritos (sdd-revisar-design).
argument-hint: --prd nome-da-feature [--prompt "descrição do pedido"]
---

# Explorar conceito SDD (Fase Elefante)

Esta sessão é o **Elefante**: acumula o que o humano traz e o que o código mostra e grava tudo no `brief.md`, a única memória que as próximas etapas e sessões terão. Debate que não está no brief se perde num reinício. Esta fase pergunta ao humano mesmo com o checkpoint em `mode: auto`.

## Estados do brief

O campo `Estado` do brief diz onde a fase está e onde ela retoma:

| Estado | Significa | Retome em |
| --- | --- | --- |
| `rascunho` | Entrevista ou proposta em curso | Passo 2, a partir de `Perguntas abertas`, ou passo 3 quando a fronteira já está vazia |
| `hipótese proposta` | HIL Hipótese perguntado, sem resposta | Passo 4 |
| `hipótese ancorada` | O humano escolheu revisar com as lentes | Passo 5 |
| `revisado` | Lentes sintetizadas; HIL Brief pendente | Passo 7 |
| `aprovado` | Aprovado no HIL Brief | Passo 8 |
| `encerrado` | Fase encerrada sem aprovação | Só por pedido explícito, que volta a `rascunho` |

## Passos

1. **Preparar.** Resolva `tasks/prd-[slug]/`; em uso avulso, derive o slug como `sdd-criar-prd`. Leia integralmente [references/postura-elefante.md](references/postura-elefante.md) e a skill `grilling`, e leia as instruções locais (`CLAUDE.md`, `AGENTS.md`) atrás de áreas críticas e restrições. Com `brief.md` existente, retome pela tabela de estados. Sem ele, crie-o a partir de [assets/brief.template.md](assets/brief.template.md), lido integralmente, com `Estado: rascunho` e o pedido de origem. Com checkpoint na pasta, grave `phase: conceito` e `sources.brief`.
   **Saída:** brief em disco e passo de retomada definido pela tabela.
2. **Entrevistar.** Conduza a entrevista pela skill `grilling`, sob a postura. A árvore de decisões cobre, no mínimo: o problema e quem sente a dor; quem ou que sistema consome o resultado e sob quais restrições; restrições inegociáveis; bordas e fora de escopo; como o problema é tratado hoje e por que isso não basta; como medir o sucesso. Antes de cada rodada, grave as perguntas dela em `Perguntas abertas`; ao receber as respostas, mova cada uma para `Decisões`. Cada rodada respondida é uma fronteira da pausa de sessão monitorada de `references/continuidade-sessao.md` da skill `sdd-orquestrar-tasks`.
   **Saída:** fronteira vazia, ou as perguntas restantes em `Perguntas abertas` com o humano de acordo em seguir.
3. **Propor.** Quando a arquitetura tem mais de uma resposta defensável, apresente as opções pela regra "Dono decide arquitetura" da postura e espere a escolha do humano; com uma só resposta defensável, siga direto. Grave no brief, não no chat, a primeira proposta técnica sobre a opção escolhida: prosa e diagrama em texto, componentes, fluxo de dados e onde a mudança pousa no código, com `caminho:linha`. Debata até o humano não contestar mais. Cada opção que sair da mesa vai para `Alternativas descartadas`, com o motivo concreto.
   **Saída:** proposta no brief sobre a opção que o humano escolheu; toda opção rejeitada registrada com motivo.
4. **HIL Hipótese.** Escreva no brief a hipótese ancorada em duas ou três frases, grave `Estado: hipótese proposta` e pergunte uma vez: revisar o conceito com as lentes (recomendada) ou esclarecer mais. Revisar grava `hipótese ancorada`; esclarecer grava `rascunho` e volta ao passo 2.
   **Saída:** resposta do humano gravada no estado do brief.
5. **Lentes.** Leia integralmente [references/lentes-conceito.md](references/lentes-conceito.md) e escolha a pasta:
   - pasta `conceito_[num]/` mais recente com o mesmo sha256 do brief em `rodada.md` e alguma lente sem `Fim do relatório.`: retome-a e despache só as lentes que faltam;
   - mesma pasta com todas as lentes terminadas: siga ao passo 6;
   - em qualquer outro caso: reserve o próximo sufixo livre e grave nele `rodada.md` com o sha256 atual do brief.

   Confira a elegibilidade pela seção Elegibilidade de `references/revisao-delegada.md` da skill `sdd-revisar-codigo`, sem a exigência de build e teste. Com checkpoint na pasta, grave `safe_to_stop: false` e um item `active_work` por lente, `{kind: "goldfish", handle, owner, scope: "conceito_[num]/[lente]", state: "em-execucao"}`, preenchendo `handle` assim que o host o devolver. Lance as lentes em paralelo, uma por subagente novo, com a instrução que a referência define. Lente que falha roda de novo uma vez; persistindo, grave você mesmo `[lente].md` com `Não rodou: [motivo]` e `Fim do relatório.`, para que a retomada não a despache outra vez. Sem subagente elegível, nenhuma lente roda: registre a limitação em `Análise das lentes` e siga ao passo 6, porque uma crítica feita nesta sessão não é Goldfish. Ao receber as lentes, retire-as de `active_work`.
   **Saída:** cada lente com arquivo terminado em `Fim do relatório.`, ou a falta de subagente registrada.
6. **Sintetizar.** Leia os arquivos das lentes, junte achados duplicados e grave-os em `Análise das lentes`, com IDs `CL[num]-NN`, dimensão, severidade e as lentes que não rodaram. Para cada achado `Bloqueante` ou `Maior`, proponha uma resposta: mudar a proposta, acrescentar um não objetivo, registrar uma premissa ou aceitar o risco. Grave `Estado: revisado`. No chat, dê o caminho do brief e destaque as duas ou três objeções mais fortes.
   **Saída:** todo achado das lentes no brief, e todo `Bloqueante` e `Maior` com resposta proposta.
7. **HIL Brief.**
   - Primeiro, decida com o humano a resposta de cada `Bloqueante`, item a item, e grave a decisão.
   - Depois, pergunte uma vez: aprovar o brief e seguir para o PRD, iterar ou encerrar mantendo o brief. Aprovar é a opção recomendada quando nenhum `Bloqueante` ficou sem resposta aceita; mostre também as lentes que não rodaram.
   - Iterar grava `rascunho` e volta ao passo 2 ou 3 com as objeções; uma nova rodada de lentes usa uma pasta nova.
   - Encerrar grava `encerrado`.
   - Aprovar grava `aprovado`. Sob o fluxo, registre a aprovação em `workflow.md` com ID e acrescente `{path: "brief.md", sha256, decision_id}` a `approved_sources`.
   **Saída:** decisão do humano gravada no estado do brief e, na aprovação, vinculada ao conteúdo pelo hash.
8. **Devolver.** Com checkpoint na pasta e o brief aprovado, grave `phase: produto`; o próximo passo é `sdd-criar-prd`. Devolva ao chamador o caminho do brief e a decisão do HIL Brief. Em uso avulso, faça a pausa de sessão monitorada com `sdd-criar-prd` como próximo passo.
   **Saída:** chamador com o brief aprovado, ou com o estado `encerrado` e o motivo.

`sdd-criar-prd` e `sdd-criar-techspec` reconciliam seus artefatos com o brief pelas regras de [references/reconciliacao-brief.md](references/reconciliacao-brief.md). O brief aprovado só muda numa nova passada desta skill, e uma mudança material nele invalida a aprovação e os artefatos derivados, pelas regras de invalidação do fluxo.
