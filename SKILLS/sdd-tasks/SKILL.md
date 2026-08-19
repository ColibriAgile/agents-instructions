---
name: sdd-tasks
description: Tasks — decomposição de uma feature em tarefas de implementação a partir do PRD e da TechSpec existentes em tasks/prd-*/. Use quando o usuário pedir para quebrar a feature em tarefas ou planejar a execução. Não use para redigir o PRD (sdd-prd) nem a TechSpec (sdd-techspec).
argument-hint: --prd nome-da-feature
disable-model-invocation: true
---

Entrada: `--prd` identifica o slug da feature; sem argumento, localize a pasta em `./tasks/prd-*/`. Obrigatórios: `tasks/prd-[slug]/prd.md` e `tasks/prd-[slug]/techspec.md` — se faltar algum, pare e aponte a skill correspondente (`/sdd-prd`, `/sdd-techspec`).

Cada tarefa é uma **entrega**: concluível de forma independente, com escopo claro e seus próprios testes. Referencie o `techspec.md` em vez de repetir detalhes de implementação.

## Fluxo

1. **Analisar** — leia PRD e TechSpec; inventarie requisitos, decisões técnicas, componentes e todos os test cases da TechSpec.
   _Pronto quando:_ o inventário de test cases estiver completo.

2. **Propor a estrutura** — monte a lista de tarefas de alto nível (máximo 10; dependências antes das dependentes — ex.: backend antes do frontend, ambos antes dos testes E2E) e _mostre ao usuário para aprovação antes de gerar qualquer arquivo_.
   _Pronto quando:_ o usuário aprovar a lista.

3. **Gerar os arquivos** — em `./tasks/prd-[slug]/`:
   - `tasks.md` seguindo `./TEMPLATE_TASKS.md` desta skill
   - um `task_[num].md` por tarefa seguindo `./TEMPLATE_TASK.md` desta skill, com subtarefas (X.1, X.2…), critérios de sucesso e testes
     _Pronto quando:_ todo test case do inventário estiver mapeado em uma tarefa e toda tarefa tiver seus testes unitários e de integração.

4. **Reportar** — apresente os arquivos gerados e aguarde a confirmação do usuário antes de qualquer implementação.
