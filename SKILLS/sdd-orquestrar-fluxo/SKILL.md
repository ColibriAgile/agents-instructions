---
name: sdd-orquestrar-fluxo
description: Fluxo SDD para conduzir uma feature com subagentes e HIL ou retomar seu checkpoint em nova sessão; não substitui uma etapa avulsa.
---

# Orquestrar o fluxo SDD

Coordene contratos, execução e aceite. O coordenador mantém estado e decisões humanas; subagentes produzem artefatos e código em escopos exclusivos.

1. **Preparar ou retomar.** Leia integralmente [references/estado-hil.md](references/estado-hil.md) e detecte `tasks/prd-[slug]/checkpoint.json` antes de iniciar trabalho. Com feature explícita, consulte somente sua pasta; sem ela, selecione o único checkpoint pendente ou solicite escolha se houver vários. Retome automaticamente o checkpoint válido da feature selecionada, sem exigir flag especial. Sem checkpoint, reconcilie artefatos existentes antes de criar estado.
   Localize as skills da tabela abaixo no catálogo instalado ou em `SKILLS/`; deixe o corpo de cada etapa ao agente responsável. Antes de delegar, leia integralmente [references/delegacao.md](references/delegacao.md). Carregue na retomada só o índice, decisões pertinentes e fontes necessárias à próxima etapa.
   Confira worktree, instruções locais, ferramentas de subagentes e fontes existentes. Registre base Git como commit resolvido e mudanças preexistentes; sem Git, registre limites de escopo. Exija as dependências da próxima fase; skill ausente bloqueia só essa fase, sem inventar execução equivalente. Preserve políticas de invocação existentes: passe nome e caminho exato explicitamente ao subagente.
   **Saída:** estado reconciliado, autorização conhecida e próxima etapa identificada. Sem subagentes, prepare fontes/estado e informe a limitação; solicite escolha antes de substituir o fluxo pedido por execução local.
2. **Produto.** Delegue criação/atualização do PRD; reutilize artefato válido existente. Para refatoração expressamente pedida, delegue `sdd-planejar-refatoracao` e use seu PRD no mesmo gate, mantendo a TechSpec como rascunho até HIL técnico.
   Confira cobertura do pedido e apresente o PRD gravado no **HIL 1**, com decisões de produto e pendências. Reuse aprovação existente somente se corresponder ao conteúdo/escopo atual.
   **Saída:** PRD aprovado e decisões registradas; pendência bloqueante impede fases dependentes.
3. **Projeto e plano.** Delegue TechSpec, confira cobertura do PRD e depois delegue planejamento de tasks. Identifique stack por alvo; em desktop C#/.NET, omita E2E e mantenha unitários, integração e aceite manual pertinente. Exija comandos que excluam E2E também de suítes agregadas. Preserve comportamento do produto ao escolher verificações.
   Apresente TechSpec + DAG + tasks concretas no **HIL 2**: arquitetura, limites, ambientes necessários, aceite manual e autorização para implementação/correções dentro desses contratos. Corrija os documentos antes de solicitar decisão; perguntas intermediárias somente para informação indispensável.
   **Saída:** plano rastreável e executável aprovado; nenhum escritor de código iniciou antes da autorização necessária.
4. **Implementar.** Delegue `sdd-orquestrar-tasks`, cedendo a ela exclusivamente manifesto e movimentos enquanto estiver ativa. Ela delega executores e revisa cada task. Ajuste profundidade/concorrência aos slots reais; se não couber coordenador aninhado, o coordenador raiz assume o DAG descrito nessa skill e delega diretamente `sdd-executar-task`.
   Limite cada chamada a um lote elegível e receba handoffs e estado antes de autorizar o próximo. Salve checkpoint e ofereça continuar ou pausar entre lotes; trate desvios pelo **HIL de exceção**.
   **Saída:** todas as tasks aprovadas com evidência integrada ou bloqueios identificados; pasta `done/` sozinha não prova conclusão.
5. **Revisar e corrigir.** Delegue revisão global a agente diferente dos autores com `sdd-revisar-codigo`, base Git e artefatos atuais. Se reprovado, delegue `sdd-planejar-correcoes` e depois `sdd-executar-correcoes` para a revisão exata. Correções dentro do HIL 2 seguem automaticamente; escopo novo, mudança de contrato ou ação externa sem autorização exige HIL de exceção sobre plano concreto.
   Limite correções a um lote por chamada e ofereça pausa após cada retorno reconciliado. Após todas as correções, delegue nova revisão independente; o executor devolve o controle sem criar revisão duplicada. Compare identidade completa dos achados (pasta + ID), causa e evidência. Achado de task original incompleta exige reconciliar sua evidência e manifesto pelo dono do DAG; concluir apenas a task de correção não encerra a obrigação original.
   **Saída:** revisão aprovada ou bloqueio real com evidência. Após duas rodadas sem redução/alteração comprovada dos bloqueios, pare o ciclo automático e apresente diagnóstico/decisão no HIL de exceção; nenhum limite transforma reprovação em aprovação.
6. **Aceite.** Confira pedido completo, PRD, TechSpec, manifesto, correções, última revisão e validações do estado integrado. Apresente no **HIL 3** caminhos, resultados, limitações, aceite manual e candidatas a ADR relevantes. Ressalvas só são opcionais se não deixam requisito/segurança/validação essencial pendente.
   **Saída:** aceite humano atual registrado e nenhuma obrigação bloqueante aberta antes de marcar `concluido`. Publique PR, faça commit/push/deploy ou promova ADR somente se solicitado/autorizado; a conclusão do fluxo não os exige.

## Etapas delegadas

Salve checkpoint antes de cada pergunta HIL, após registrar sua resposta, entre lotes e após cada revisão. Ofereça a troca manual de sessão nesses pontos conforme o protocolo de estado; pausar não aprova um gate nem conclui a feature. Ao concluir, marque o checkpoint `concluido` para impedir retomada automática de trabalho encerrado.

| Entrada disponível | Skill responsável | Artefato/resultado |
| --- | --- | --- |
| Pedido | `sdd-criar-prd` | `prd.md` |
| Refatoração solicitada | `sdd-planejar-refatoracao` | `prd.md`, `techspec.md` |
| PRD aprovado | `sdd-criar-techspec` | `techspec.md` |
| PRD + TechSpec | `sdd-planejar-tasks` | `tasks.md`, `task_*.md` |
| Plano aprovado | `sdd-orquestrar-tasks` / `sdd-executar-task` | implementação e handoffs |
| Implementação | `sdd-revisar-codigo` | `codereview_[num]/codereview.md` |
| Revisão com achados autorizados | `sdd-planejar-correcoes` | tasks na pasta da revisão |
| Correções planejadas | `sdd-executar-correcoes` | correções e handoffs; retorno à revisão |
