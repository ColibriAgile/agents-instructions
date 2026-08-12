---
name: orquestrar-tasks
description: "Orquestra a execucao de tarefas de uma feature a partir de tasks/prd-<nome>/. Use quando o usuario pedir para executar, coordenar ou acompanhar tarefas definidas por PRD, TechSpec e arquivos task_*.md, inclusive com subagentes paralelos, revisao e retrabalho."
argument-hint: "--prd nome-da-task --budget economico|medio|alto"
disable-model-invocation: true
---

# Orquestrar Tasks

Execute uma feature como uma sequencia controlada de tarefas definidas em `tasks/prd-<nome>/`. A entrada `--prd` identifica o slug; sem ela, localize uma unica pasta `tasks/prd-*/`. Se houver zero ou mais de uma candidata, pare e use a tool de pergunta para obter o slug.

## Precondicoes

1. Confirme que existem `prd.md`, `techspec.md` e `tasks.md` na pasta da feature.
2. Leia integralmente esses arquivos e todos os `task_*.md` que ainda nao estejam em `done/`.
3. Em `tasks.md`, localize o estado, a ordem e as dependencias de cada tarefa. Se houver inconsistencias entre o indice e os arquivos, registre o problema e pare para decisao humana.
4. Crie `done/` somente no momento de concluir a primeira tarefa.

## Planejamento

1. Extraia de cada tarefa: objetivo, arquivos afetados, dependencias, criterios de sucesso, testes e riscos.
2. Monte um grafo de dependencias. So inicie tarefas cujas dependencias estejam concluidas.
3. Agrupe em paralelo apenas tarefas independentes que nao alterem os mesmos arquivos, contratos publicos, configuracoes compartilhadas ou ambiente de teste.
4. Antes de cada lote:
    1. Escolha a melhor estrategia de execucao disponivel, em ordem de preferencia:
        - Executor paralelo nativo da ferramenta, quando o lote contiver mais de uma unidade de trabalho independente.
        - Subagentes nativos.
        - Sessoes independentes.
        - Execucao sequencial.
    2. Escolha o executor que melhor corresponda ao dominio de cada unidade de trabalho. Inspecione os agentes configurados no workspace e prefira suas especialidades declaradas, por exemplo .NET/C#, frontend, Delphi, migracao ou hot path.
5. Para cada delegacao, selecione o modelo e nivel de reasoning proporcionais ao risco levando em consideração o budget informado em `--budget` (o padrão é economico)
    - para budget "economico" ou não informado, use gpt-5.6-luna ou sonnet com reasoning medio
    - para budget "medio", use gpt-5.6-luna ou sonnet com reasoning medio a high até o gpt-5.6-terra ou opus com reasoning medio
    - para budget "alto", use modelos de custo mais alto e reasoning completo como gpt-5.6-terra ou opus com reasoning medio

## Delegacao

Para cada tarefa, envie ao subagente:

- o caminho da pasta da feature e do arquivo `task_*.md`;
- requisitos relevantes de `prd.md` e decisoes de `techspec.md`;
- escopo exato, criterios de aceite e testes exigidos;
- arquivos que pode alterar e restricoes de coexistencia com outras tarefas;
- a instrucao para implementar, validar e relatar arquivos modificados, comandos executados, resultados e bloqueios.
- instrua o subagente a marcar cada subtask do arquivo de task relacionado conforme for concluida.

Nao aceite apenas uma explicacao: a delegacao deve produzir a implementacao e as validacoes cabiveis. Aguarde o resultado de todo o lote paralelo antes de revisar qualquer tarefa que dependa dele.

## Revisao E Retrabalho

Ao receber uma tarefa concluida:

1. Compare a alteracao com o PRD, a TechSpec e cada criterio do arquivo da tarefa.
2. Revise efeitos nos contratos, erros, casos limite, testes e aderencia aos padroes do repositorio.
3. Execute a menor validacao automatizada que possa refutar a conclusao; execute validacoes adicionais exigidas pela tarefa ou necessarias ao risco da mudanca.
4. Se algo estiver ausente, incorreto ou sem validacao suficiente, devolva a mesma tarefa ao subagente com achados objetivos e exija os ajustes. Repita revisao e validacao ate a conformidade.
5. Quando houver desacordo tecnico relevante, risco fora do escopo ou impossibilidade de validar, nao marque a tarefa como concluida.

## Conclusao Da Tarefa

Somente depois de aprovada na revisao:

1. Crie `tasks/prd-<nome>/done/`, se necessario, e mova o arquivo `task_*.md` para ela sem renomea-lo.
2. Atualize a entrada correspondente em `tasks.md` como completa, preservando o historico e o formato existentes.
3. Adicione ou atualize a secao `## Problemas e solucoes` em `tasks.md` com data, tarefa, problema, impacto, solucao aplicada e estado. Registre tambem problemas resolvidos; nao inclua detalhes sensiveis.
4. Recalcule as tarefas agora elegiveis e inicie o proximo lote.

## Pausa Para Decisao Humana

Pare o fluxo e use a ferramenta de perguntas quando faltar uma decisao humana explicita, incluindo requisito ambiguo, mudanca de arquitetura, conflito entre PRD e TechSpec, dependencia externa indisponivel, falha nao reproduzivel, credencial, acesso ou aprovacao necessaria.

Explique de forma concisa: a tarefa afetada, o que impediu a continuidade, a evidencia coletada, alternativas viaveis e a decisao necessaria. Registre o bloqueio em `## Problemas e solucoes`; nao mova nem marque a tarefa como concluida.

## Criterios De Encerramento

Considere a feature concluida somente quando:

- nao houver arquivos `task_*.md` pendentes fora de `done/`;
- todas as tarefas estiverem completas em `tasks.md`;
- todos os criterios de aceite e testes definidos estiverem atendidos;
- os problemas e solucoes encontrados estiverem registrados;
- a validacao final proporcional ao escopo tiver sido executada com sucesso.