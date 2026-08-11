---
name: codereview-to-tasks
description: 'Analisa o relatório codereview.md gerado por executar-review e cria tarefas de correção para cada não conformidade acionável. Use para transformar code reviews reprovados ou com ressalvas em task_[num].md na pasta da revisão.'
argument-hint: '--prd nome-da-feature --num numero-da-revisao'
disable-model-invocation: true
---

# Code Review para Tarefas

Converta um artefato da skill `executar-review` em tarefas de implementação focadas na correção dos problemas encontrados. Esta é uma skill pessoal e grava os arquivos diretamente na pasta da code review selecionada.

## Quando usar

- Quando existir um relatório `codereview.md` produzido por `executar-review`.
- Quando for necessário transformar itens `NOK`, tasks incompletas, testes falhando ou recomendações acionáveis em tarefas.
- Quando houver mais de uma pasta `codereview_*` e for necessário usar a revisão mais recente.

Não use para executar a correção no código, substituir o code review ou criar um PRD/TechSpec.

## Entrada e seleção da revisão

Aceite:

- `--prd <nome-da-feature>` e `--num <n>` juntos: usa explicitamente `/tasks/prd-<nome-da-feature>/codereview_<n>/`.
- `--prd <nome-da-feature>` sem `--num`: restringe a busca às pastas `codereview_*` dentro de `/tasks/prd-<nome-da-feature>/`.
- `--num <n>` sem `--prd`: restringe a busca às pastas `codereview_<n>` de qualquer feature em `/tasks/prd-*/`.
- Sem `--prd` e sem `--num`: considera todas as pastas `/tasks/prd-*/codereview_*/`.

Monte a lista de candidatas aplicando os filtros acima:

1. Localize recursivamente diretórios `codereview_<n>` com sufixo numérico dentro de `/tasks/prd-*/` que contenham `codereview.md`.
2. Descarte pastas sem `codereview.md`.
3. Nunca misture achados de revisões diferentes.

Depois de aplicar os filtros:

- Zero candidatas: pare e explique o problema sem criar arquivos.
- Exatamente uma candidata: use-a diretamente, sem perguntar.
- Mais de uma candidata: liste cada uma como `<nome-da-feature> / codereview_<n>` e use a tool de pergunta para o usuário escolher qual revisão converter antes de criar qualquer arquivo.

Informe no resultado o caminho escolhido. Se o relatório da candidata selecionada estiver vazio ou ilegível, pare e explique o problema sem criar arquivos.

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
