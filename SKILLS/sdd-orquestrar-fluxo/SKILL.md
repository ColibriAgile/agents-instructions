---
name: sdd-orquestrar-fluxo
description: Fluxo SDD para conduzir uma feature com subagentes e HIL ou retomar seu checkpoint em nova sessão; não substitui uma etapa avulsa.
---

# Orquestrar o fluxo SDD

Coordene contratos, execução e aceite. O coordenador mantém estado e decisões humanas; subagentes produzem artefatos e código em escopos exclusivos.

1. **Preparar ou retomar.** Leia integralmente [references/estado-hil.md](references/estado-hil.md) e detecte `tasks/prd-[slug]/checkpoint.json` antes de iniciar trabalho. Com feature explícita, consulte somente sua pasta; sem ela, selecione o único checkpoint pendente ou solicite escolha se houver vários. Retome automaticamente o checkpoint válido da feature selecionada, sem exigir flag especial. Sem checkpoint, reconcilie artefatos existentes antes de criar estado; em pedido amplo ainda sem recorte, fixe os slugs no passo 2 antes de abrir estado.
   Localize as skills da tabela abaixo no catálogo instalado ou em `SKILLS/`; deixe o corpo de cada etapa ao agente responsável. Antes de delegar, leia integralmente [references/delegacao.md](references/delegacao.md). Carregue na retomada só o índice, decisões pertinentes e fontes necessárias à próxima etapa.
   Confira worktree, instruções locais, ferramentas de subagentes e fontes existentes. Registre base Git como commit resolvido e mudanças preexistentes; sem Git, registre limites de escopo. Exija as dependências da próxima fase; skill ausente bloqueia só essa fase, sem inventar execução equivalente. Preserve políticas de invocação existentes: passe nome e caminho exato explicitamente ao subagente.
   **Saída:** estado reconciliado, autorização conhecida e próxima etapa identificada. Sem subagentes, prepare fontes/estado e informe a limitação; solicite escolha antes de substituir o fluxo pedido por execução local.
2. **Produto.** Delegue criação/atualização do PRD; reutilize artefato válido existente. Para refatoração expressamente pedida, delegue `sdd-planejar-refatoracao` e use seu PRD no mesmo gate, mantendo a TechSpec como rascunho até HIL técnico. Com mais de um resultado principal no pedido, delegue antes `sdd-orquestrar-prds`: ela aprova o recorte com o usuário e grava um PRD por recorte sob prefixo comum; registre o recorte aprovado como decisão em `workflow.md`.
   Confira cobertura do pedido e apresente o PRD gravado no **HIL 1**, com decisões de produto e pendências. Com recorte, apresente o conjunto num só HIL 1, abra um checkpoint por recorte aprovado e conduza cada recorte como feature própria a partir do passo 3, na ordem de dependência. Reuse aprovação existente somente se corresponder ao conteúdo/escopo atual.
   **Saída:** PRD aprovado e decisões registradas; com recorte, cada recorte tem PRD aprovado ou adiamento explícito. Pendência bloqueante impede fases dependentes.
3. **Projeto e plano.** Delegue TechSpec, confira cobertura do PRD e depois delegue planejamento de tasks. Identifique stack por alvo; em desktop C#/.NET, omita E2E e mantenha unitários, integração e aceite manual pertinente. Exija comandos que excluam E2E também de suítes agregadas. Preserve comportamento do produto ao escolher verificações.
   Se a TechSpec recomendar refatoração preparatória, apresente-a no **HIL 2** antes do plano: escopo mínimo, medidas que a motivaram e o que ela torna fácil na feature. Aprovada, delegue `sdd-planejar-refatoracao` para esse escopo, conduza-a como feature que precede — checkpoint próprio, ordem de dependência, como nos recortes do passo 2 — e só então replaneje as tasks da feature sobre o terreno já preparado. Recusada, registre o risco na TechSpec e siga; o baseline continua valendo em qualquer um dos destinos. Uma recomendação decidida não é reapresentada.
   Apresente TechSpec + DAG + tasks concretas no **HIL 2**: arquitetura, limites, ambientes necessários, aceite manual e autorização para implementação/correções dentro desses contratos. Corrija os documentos antes de solicitar decisão; perguntas intermediárias somente para informação indispensável.
   **Saída:** plano rastreável e executável aprovado, com refatoração preparatória decidida uma única vez; nenhum escritor de código iniciou antes da autorização necessária.
4. **Implementar.** Delegue `sdd-orquestrar-tasks`, cedendo a ela exclusivamente manifesto e movimentos enquanto estiver ativa. Ela delega executores e revisa cada task. Ajuste profundidade/concorrência aos slots reais; se não couber coordenador aninhado, o coordenador raiz assume o DAG descrito nessa skill e delega diretamente `sdd-executar-task`.
   Limite cada chamada a um lote elegível e receba handoffs e estado antes de autorizar o próximo. Salve checkpoint e ofereça continuar ou pausar entre lotes; trate desvios pelo **HIL de exceção**.
   **Saída:** todas as tasks aprovadas com evidência integrada ou bloqueios identificados; pasta `done/` sozinha não prova conclusão.
5. **Revisar e corrigir.** Delegue revisão global a agente diferente dos autores com `sdd-revisar-codigo`, base Git e artefatos atuais. Leia o status literal do `codereview.md` recebido, grave-o em `review_status` e siga exatamente um destino:
   - `APROVADO` encerra o ciclo de revisão: siga ao passo 6 com esse relatório como evidência de aceite.
   - `APROVADO COM RESSALVAS` encerra o ciclo automático e abre o **HIL de ressalvas**: apresente cada item ressalvado com impacto e esforço, e pergunte se deve corrigir os itens escolhidos ou finalizar. Corrigir abre uma rodada limitada a esse escopo; finalizar segue ao passo 6 com os itens registrados como pendências aceitas. Ressalva que deixa requisito, segurança ou validação essencial pendente é bloqueio e segue o destino de `REPROVADO`.
   - `REPROVADO` abre uma rodada de correção: delegue `sdd-planejar-correcoes` e depois `sdd-executar-correcoes` para a revisão exata. Correções dentro do HIL 2 seguem automaticamente; escopo novo, mudança de contrato ou ação externa sem autorização exige HIL de exceção sobre plano concreto.
   - Status ausente ou irreconhecível é bloqueio do relatório: peça o parecer explícito à revisão antes de escolher destino.
   Cada rodada termina em no máximo uma revisão nova, delegada pelo coordenador após o lote final; o executor de correções devolve o controle e o coordenador emite a re-revisão. Limite correções a um lote por chamada e ofereça pausa após cada retorno reconciliado. Compare identidade completa dos achados (pasta + ID), causa e evidência. Achado de task original incompleta exige reconciliar sua evidência e manifesto pelo dono do DAG; concluir apenas a task de correção não encerra a obrigação original.
   **Saída:** status literal da última revisão registrado e destinado uma única vez; `APROVADO` ou ressalvas decididas seguem ao passo 6 sem nova revisão. Após duas rodadas sem redução/alteração comprovada dos bloqueios, pare o ciclo automático e apresente diagnóstico/decisão no HIL de exceção; nenhum limite transforma reprovação em aprovação.
6. **Aceite.** Confira pedido completo, PRD, TechSpec, manifesto, correções, última revisão e validações do estado integrado. Apresente no **HIL 3** caminhos, resultados, limitações, aceite manual, ressalvas aceitas no passo 5 e candidatas a ADR relevantes. Se a revisão registrou escalonamento sugerido, apresente a skill e o gatilho contado como decisão do usuário para depois do aceite; auditoria pesada não roda dentro do ciclo.
   **Saída:** aceite humano atual registrado e nenhuma obrigação bloqueante aberta antes de marcar `concluido`. Publique PR, faça commit/push/deploy ou promova ADR somente se solicitado/autorizado; a conclusão do fluxo não os exige.

## Etapas delegadas

Salve checkpoint antes de cada pergunta HIL, após registrar sua resposta, entre lotes e após cada revisão. Ofereça a troca manual de sessão nesses pontos conforme o protocolo de estado; pausar não aprova um gate nem conclui a feature. Ao concluir, marque o checkpoint `concluido` para impedir retomada automática de trabalho encerrado.

| Entrada disponível | Skill responsável | Artefato/resultado |
| --- | --- | --- |
| Pedido | `sdd-criar-prd` | `prd.md` |
| Pedido com mais de um resultado principal | `sdd-orquestrar-prds` | um `prd.md` por recorte sob prefixo comum |
| Refatoração solicitada | `sdd-planejar-refatoracao` | `prd.md`, `techspec.md` |
| PRD aprovado | `sdd-criar-techspec` | `techspec.md` |
| PRD + TechSpec | `sdd-planejar-tasks` | `tasks.md`, `task_*.md` |
| Plano aprovado | `sdd-orquestrar-tasks` / `sdd-executar-task` | implementação e handoffs |
| Implementação | `sdd-revisar-codigo` | `codereview_[num]/codereview.md` |
| Revisão com achados autorizados | `sdd-planejar-correcoes` | tasks na pasta da revisão |
| Correções planejadas | `sdd-executar-correcoes` | correções e handoffs; retorno à revisão |
