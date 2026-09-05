---
name: sdd-planejar-tasks
description: Tasks SDD quando é preciso decompor PRD e TechSpec em um DAG executável; não implementa a feature.
argument-hint: --prd nome-da-feature [--atualizar]
disable-model-invocation: true
---

# Planejar tasks SDD

1. Resolva `tasks/prd-[slug]/`. Exija e leia `prd.md` e `techspec.md`, nessa ordem, uma vez por versão. Depois inventarie `tasks.md`, `task_*.md` e `done/task_*.md`. Reutilize plano existente sem sobrescrever; para atualização autorizada, preserve IDs, handoffs e tasks concluídas.
   **Saída:** fontes e estado reconciliados; links quebrados ou IDs conflitantes bloqueiam apenas a atualização afetada.
2. Extraia em uma passagem obrigações, decisões, componentes, riscos e testes. Preserve IDs; para fontes legadas, atribua IDs locais e seção de origem. Mapeie cada item a entrega e evidência, ou pendência que altere escopo/aceite.
   **Saída:** inventário completo e rastreável, incluindo limites fora de escopo.
3. Use fatias verticais: um resultado revisável, implementação e testes na mesma task. Separe fundação apenas quando desbloquear múltiplas entregas ou permitir migração independente. Modele dependências acíclicas e colisões de arquivos/contratos; numere novas tasks após o maior ID na raiz e em `done/`.
   **Saída:** todo item não pendente tem task; toda task tem origem, limites, dependências e verificação.
4. Aplique o perfil da TechSpec. Em desktop C#/.NET, omita E2E inclusive local e registre a exclusão; mantenha unitários, integração pertinente e roteiro manual para aceite visual. Em repositórios mistos, classifique por projeto. Para outros alvos, E2E somente quando pertinente ao contrato.
   Prefira validação local que comprove o comportamento. Um fake não comprova semântica do serviço real: preserve lacunas. Registre ambiente necessário e autorização existente; se faltar decisão indispensável, mantenha a obrigação pendente e prepare as tasks independentes.
   **Saída:** comandos reais e pré-requisitos conhecidos; nenhuma obrigação desapareceu para baratear testes.
5. Ao gerar contratos, leia integralmente [assets/tasks.template.md](assets/tasks.template.md) e [assets/task.template.md](assets/task.template.md). Grave o rascunho revisável antes de pedir HIL. Use `tasks.md` como fonte do DAG, links e estado; copie apenas invariantes curtos nas tasks e referencie detalhes da TechSpec.
   **Saída:** manifesto e tasks existem; links resolvem; IDs únicos; nenhum placeholder fora do handoff inicial.
6. Confira cobertura, rastreabilidade, DAG, atomicidade, comandos, ambiente e idempotência. Apresente o plano com riscos e pendências. Devolva ao HIL do orquestrador; em uso avulso, obtenha aprovação antes da implementação apenas se ela ainda não estiver autorizada.
   **Saída:** plano pronto para execução no escopo aprovado ou bloqueios associados a IDs concretos.

Se uma fonte mudar durante o planejamento, reconcilie o inventário e invalide apenas os derivados afetados. Falta de PRD/TechSpec direciona à skill criadora correspondente. Estado mutável fica depois das fontes; leia somente o código necessário para resolver caminhos ou comandos.
