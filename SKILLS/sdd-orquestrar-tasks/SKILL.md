---
name: sdd-orquestrar-tasks
description: "Orquestra uma feature SDD completa; a execução isolada de uma task pertence a sdd-executar-task."
argument-hint: "--prd nome-da-task --budget economico|medio|alto"
disable-model-invocation: true
---

# Orquestrar uma feature SDD

Coordene a feature como um DAG de tasks. Delegue a implementação a `sdd-executar-task` e preserve revisão e estado global como responsabilidades do orquestrador.

## Steps — orquestração

**Step 1: Fixar a feature**

1. Resolva `--prd` para uma única pasta `tasks/prd-<slug>/`; na ausência do argumento, use a feature já identificada na sessão.
2. Exija `prd.md`, `techspec.md` e `tasks.md` e leia-os integralmente antes das tasks pendentes.
3. Relacione cada entrada do manifesto ao respectivo `task_*.md` fora de `done/` e confronte estado, ordem e dependências.

*Done when:* cada entrada do manifesto está ligada a um arquivo e toda inconsistência está resolvida ou registrada como bloqueio humano.

**Step 2: Formar o próximo lote**

1. Monte o DAG usando dependências, resultado, arquivos afetados, contratos, ambiente de teste e riscos de cada task.
2. Selecione somente tasks cujas dependências estejam concluídas.
3. Agrupe em paralelo somente tasks que não disputem arquivos, contratos públicos, configuração compartilhada ou ambiente de teste.
4. Escolha, nesta ordem, executor paralelo nativo, subagentes nativos, sessões independentes ou execução sequencial. Quando houver delegação, aplique o budget da referência abaixo.

*Done when:* existe um lote elegível sem colisões ou um bloqueio explícito impede novo trabalho.

**Step 3: Executar por contrato**

1. Invoque `sdd-executar-task` uma vez para cada task do lote, no executor selecionado ou na sessão atual.
2. Passe somente o caminho exato da task e restrições voláteis de coexistência; deixe cada executor ler PRD, TechSpec e task diretamente.
3. Aguarde todo o lote e exija implementação, validações e `## Handoff` preenchido em cada task.

*Done when:* cada task do lote retorna uma implementação verificável ou um bloqueio reproduzível, sem alteração de `tasks.md` ou `done/` pelo executor.

**Step 4: Revisar e retrabalhar**

1. Compare cada diff e handoff com PRD, TechSpec, task e padrões do repositório.
2. Revise contratos, erros, casos limite, testes e candidatas a ADR; confirme que cada candidata está completa e passa o gate definido em `sdd-executar-task`.
3. Execute a menor validação automatizada capaz de refutar a conclusão e as verificações adicionais proporcionais ao risco.
4. Devolva achados objetivos ao mesmo executor e repita somente a task defeituosa até a conformidade.
5. Encaminhe para decisão humana requisito ambíguo, mudança arquitetural, conflito entre fontes, dependência externa, falha não reproduzível, credencial, acesso ou aprovação ausente.

*Done when:* cada task do lote está aprovada por revisão independente ou vinculada a uma decisão humana específica.

**Step 5: Concluir as tasks aprovadas**

1. Crie `done/` no primeiro encerramento e mova para ele somente tasks aprovadas, preservando seus nomes.
2. Marque as entradas correspondentes em `tasks.md` como completas.
3. Atualize `## Problemas e soluções` com data, task, problema, impacto, solução e estado, incluindo problemas resolvidos e omitindo dados sensíveis.
4. Recalcule o DAG e retorne ao Step 2 enquanto houver trabalho elegível.

*Done when:* cada task aprovada está em `done/`, seu estado global está consistente e o próximo lote foi determinado.

**Step 6: Encerrar a feature**

1. Confirme que não existem `task_*.md` pendentes fora de `done/` e que todo o manifesto está completo.
2. Confirme critérios de aceite, testes, problemas, soluções e handoffs de todas as tasks.
3. Execute a validação final proporcional ao escopo da feature.

*Done when:* toda task está concluída, toda evidência exigida está registrada e a validação final termina com sucesso.

## Reference — budget de delegação

- `economico` ou ausente: use gpt-5.6-luna ou sonnet com reasoning médio.
- `medio`: use gpt-5.6-luna ou sonnet com reasoning médio a alto, chegando a gpt-5.6-terra ou opus com reasoning médio conforme o risco.
- `alto`: use gpt-5.6-terra ou opus com reasoning proporcional ao risco.

## Error Handling

- Se zero ou mais de uma feature corresponder ao contexto, solicite o slug e aguarde uma resposta identificável.
- Se manifesto e arquivos divergirem, registre a evidência e aguarde decisão humana antes de executar.
- Se uma task bloquear, registre em `## Problemas e soluções` a evidência, alternativas e decisão necessária; preserve seu estado pendente.
