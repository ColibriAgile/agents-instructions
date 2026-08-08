---
name: codereview-to-tasks
description: 'Analisa o relatório codereview.md gerado por execute-review e cria tarefas de correção para cada não conformidade acionável. Use para transformar code reviews reprovados ou com ressalvas em task_[num].md na pasta da revisão.'
argument-hint: '--codereview caminho-da-pasta ou --num numero-da-revisao'
disable-model-invocation: true
---

# Code Review para Tarefas

Converta um artefato da skill `execute-review` em tarefas de implementação focadas na correção dos problemas encontrados. Esta é uma skill pessoal e grava os arquivos diretamente na pasta da code review selecionada.

## Quando usar

- Quando existir um relatório `codereview.md` produzido por `execute-review`.
- Quando for necessário transformar itens `NOK`, tasks incompletas, testes falhando ou recomendações acionáveis em tarefas.
- Quando houver mais de uma pasta `codereview_*` e for necessário usar a revisão mais recente.

Não use para executar a correção no código, substituir o code review ou criar um PRD/TechSpec.

## Entrada e seleção da revisão

Aceite uma destas entradas:

- `--codereview <caminho>`: usa explicitamente a pasta informada.
- `--num <n>`: usa a pasta `codereview_<n>` encontrada no workspace.
- Sem argumento: localiza recursivamente pastas `codereview_*` que contenham `codereview.md`.

Quando não houver entrada explícita:

1. Considere somente diretórios cujo nome seja `codereview_<n>` com `<n>` numérico e que contenham `codereview.md`.
2. Se houver mais de um, selecione o maior número de revisão.
3. Se não houver sufixo numérico válido, use o `codereview.md` com a data de modificação mais recente como fallback.
4. Informe no resultado o caminho escolhido. Nunca misture achados de revisões diferentes.

Se a pasta ou o relatório não existir, estiver vazio ou houver ambiguidade que não possa ser resolvida pelos critérios acima, pare e explique o problema sem criar arquivos.

## Procedimento

1. Leia `codereview.md` inteiro e identifique o status da revisão, as regras não conformes, as decisões da TechSpec não implementadas, as tasks incompletas, os testes falhando, os problemas encontrados e as recomendações pendentes.
2. Use apenas itens que exigem uma ação de correção. Ignore pontos positivos, itens marcados como OK/SIM/COMPLETA e recomendações puramente informativas.
3. Para cada item acionável, confira os arquivos, símbolos, linhas e testes citados no relatório. Leia o código próximo quando isso for necessário para tornar a tarefa verificável, mas não implemente a correção.
4. Agrupe em uma única tarefa somente achados que tenham a mesma causa, os mesmos arquivos e o mesmo resultado verificável. Mantenha tarefas separadas quando a correção, os testes ou os responsáveis técnicos forem diferentes.
5. Para cada tarefa, use o formato de [TEMPLATE_TASK.md](./references/TEMPLATE_TASK.md) e substitua `X` pelo número sequencial. A tarefa deve:
   - descrever o problema observado no `codereview.md`;
   - listar os requisitos e o comportamento esperado, sem inventar requisitos fora do review ou da TechSpec referenciada;
   - incluir subtarefas concretas e ordenadas;
   - apontar as seções do `codereview.md`, da TechSpec e das rules/skills relevantes;
   - definir critérios de sucesso objetivos;
   - especificar testes unitários, de integração e E2E somente quando aplicáveis;
   - listar os arquivos relevantes, incluindo arquivos de teste quando conhecidos.
6. Detecte os arquivos `task_[num].md` já existentes na pasta selecionada. Não sobrescreva arquivos. Comece no próximo número disponível e preserve a numeração contínua das novas tarefas.
7. Crie somente os arquivos `task_[num].md` dentro da pasta da code review. Não crie `tasks.md`, não mova o relatório e não altere o código.
8. Faça uma verificação final antes de concluir:
   - todo item acionável do relatório está coberto por uma tarefa ou foi explicitamente descartado com justificativa;
   - nenhuma tarefa contém mais de um problema sem causa comum;
   - cada tarefa possui subtarefas, critérios de sucesso, testes e arquivos relevantes;
   - os caminhos e linhas citados existem ou estão marcados como dependentes de confirmação;
   - nenhum arquivo existente foi sobrescrito.
9. Relate a pasta analisada, o status do review, os arquivos gerados e quaisquer itens não convertidos, com a justificativa.

## Regras por status

- `APROVADO`: não crie tarefas automaticamente. Só crie algo se o usuário indicar explicitamente uma recomendação ou item específico que deseja transformar em tarefa.
- `APROVADO COM RESSALVAS`: crie tarefas para ressalvas ou recomendações que tenham ação técnica clara.
- `REPROVADO`: crie tarefas para problemas, violações, não aderências, tasks incompletas e testes falhando.
- Status ausente ou diferente: trate como revisão que exige análise cuidadosa; crie tarefas apenas para achados explicitamente acionáveis e registre a ausência do status.

## Critérios de qualidade

Uma tarefa está pronta quando outro agente consegue implementá-la sem reler todo o histórico da conversa, entendendo o problema, o resultado esperado, os limites da mudança e como validar a correção. Não masque incertezas: registre no campo apropriado quando o relatório não fornecer arquivo, linha, requisito ou teste suficientes.
