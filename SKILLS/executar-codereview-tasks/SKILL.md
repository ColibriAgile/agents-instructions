---
name: executar-codereview-tasks
description: 'Executa as tarefas task_[num].md geradas a partir de um code review, implementa as correções, valida cada resultado, faz retrabalho quando necessário e conclui com uma nova verificação da revisão.'
argument-hint: '--prd nome-da-feature --num numero-da-revisao [--budget economico|medio|alto]'
disable-model-invocation: true
---

# Executar Tarefas de Code Review

Implemente e valide as tarefas de correção geradas pela skill `codereview-to-tasks` dentro da pasta `/tasks/prd-[nome-da-feature]/codereview_*`. O agente principal atua apenas como orquestrador: planeja, delega, revisa, decide o retrabalho e conclui. A implementação de cada tarefa é sempre feita por um subagente — nunca diretamente pelo agente principal, mesmo em correções pequenas ou de um único arquivo.

Esta skill segue a mesma estratégia de orquestração da skill `orquestrar-tasks` (grafo de dependências, lotes paralelos, escolha de executor e modelo, delegação obrigatória, revisão e retrabalho). Não reutilize `orquestrar-tasks` diretamente: tarefas de code review não exigem `prd.md`, `techspec.md` ou `tasks.md`, e o estado é controlado pela pasta `done/` da própria revisão.

## Quando usar

- Quando `codereview.md` já foi analisado e existem arquivos `task_[num].md` pendentes na pasta da revisão.
- Quando for necessário corrigir as não conformidades encontradas em um code review.
- Quando cada correção precisa ser implementada, testada e revisada antes de ser considerada concluída.

Não use para criar tarefas, executar QA sem um relatório de code review ou alterar o relatório original para esconder um achado.

## Entrada e seleção da revisão

Aceite:

- `--prd <nome-da-feature>` e `--num <n>` juntos: usa explicitamente `/tasks/prd-<nome-da-feature>/codereview_<n>/`.
- `--prd <nome-da-feature>` sem `--num`: restringe a busca às pastas `codereview_*` dentro de `/tasks/prd-<nome-da-feature>/`.
- `--num <n>` sem `--prd`: restringe a busca às pastas `codereview_<n>` de qualquer feature em `/tasks/prd-*/`.
- Sem `--prd` e sem `--num`: considera todas as pastas `/tasks/prd-*/codereview_*/`.
- `--budget economico|medio|alto`: ajusta o custo e a profundidade das delegações; o padrão é `economico`.

Monte a lista de candidatas aplicando os filtros acima:

1. Localize recursivamente diretórios `codereview_<n>` com sufixo numérico dentro de `/tasks/prd-*/` que contenham `codereview.md` e pelo menos um `task_[num].md` pendente (fora de `done/`) na raiz.
2. Descarte pastas sem `codereview.md` ou sem nenhuma tarefa pendente.
3. Nunca combine tarefas ou relatórios de pastas diferentes.

Depois de aplicar os filtros:

- Zero candidatas: pare e informe que não há revisão pendente compatível com os parâmetros informados.
- Exatamente uma candidata: use-a diretamente, sem perguntar.
- Mais de uma candidata: liste cada uma como `<nome-da-feature> / codereview_<n>` (com a contagem de tarefas pendentes) e use a tool de pergunta para o usuário escolher qual executar antes de alterar qualquer arquivo.

## Pré-condições

1. Leia integralmente `codereview.md` e todos os `task_[num].md` pendentes na raiz da pasta selecionada. Ignore tarefas que já estejam em `done/`.
2. Confirme que cada tarefa contém objetivo, requisitos, subtarefas, critérios de sucesso, testes e arquivos relevantes. Se faltar informação essencial, registre o bloqueio e peça esclarecimento antes da implementação.
3. Relacione cada tarefa aos achados do relatório. Não execute uma tarefa que não possa ser vinculada a um achado ou requisito explícito.
4. Verifique o estado atual do repositório e preserve alterações existentes do usuário. Não reverta mudanças fora do escopo da tarefa.
5. Determine as dependências pela ordem indicada nas tarefas, pelos arquivos e contratos compartilhados e pela relação entre as correções. Quando a ordem não puder ser inferida com segurança, pare para decisão humana.

## Planejamento

1. Para cada tarefa, extraia objetivo, arquivos permitidos, critérios de sucesso, testes obrigatórios, riscos e dependências.
2. Monte um grafo de dependências a partir da ordem indicada nas tarefas, dos arquivos e contratos compartilhados e da relação entre as correções. Quando a ordem não puder ser inferida com segurança, pare para decisão humana.
3. Agrupe em lotes apenas tarefas independentes que não alterem os mesmos arquivos, contratos públicos, configurações compartilhadas, migrações ou ambiente de teste.
4. Antes de cada lote:
   1. Escolha a melhor estratégia de execução disponível, em ordem de preferência:
      - Executor paralelo nativo da ferramenta, quando o lote contiver mais de uma unidade de trabalho independente.
      - Subagentes nativos.
      - Sessões independentes.
      - Execução sequencial.
   2. Escolha o executor que melhor corresponda ao domínio de cada tarefa entre os agentes configurados no workspace, considerando .NET/C#, frontend, Delphi, migração ou hot path.
      - Se um executor tiver configuração de tools inválida para o ambiente, ignore essas tools ou gere uma cópia do executor com tools equivalentes no ambiente atual antes de executar.
5. Para cada delegação, selecione o modelo e o nível de reasoning proporcionais ao risco, considerando o budget informado em `--budget` (o padrão é economico):
   - budget "economico" ou não informado: gpt-5.6-luna ou sonnet com reasoning high a xhigh;
   - budget "medio": gpt-5.6-luna ou sonnet com reasoning medio a xhigh, até gpt-5.6-terra ou opus com reasoning medio;
   - budget "alto": modelos de custo mais alto e reasoning completo, como gpt-5.6-terra ou opus com reasoning high ou xhigh.

## Delegação

Regra sem exceção: toda tarefa, inclusive tarefas pequenas ou de um único arquivo, é implementada por um subagente (ou pelo executor/sessão equivalente escolhido no planejamento). O agente principal nunca edita o código da correção diretamente; seu papel é orquestrar, revisar e decidir.

Para cada tarefa, informe ao subagente:

- caminho absoluto da pasta da code review e do `task_[num].md`;
- achado correspondente em `codereview.md`;
- escopo, requisitos, critérios de sucesso e testes;
- arquivos que podem ser alterados e restrições de coexistência com as demais tarefas do lote;
- instrução para implementar, validar e relatar arquivos alterados, comandos executados, resultados e bloqueios.

Não aceite apenas análise ou uma sugestão: a delegação deve produzir a implementação e as validações cabíveis. Aguarde o resultado de todo o lote paralelo antes de revisar ou iniciar tarefas dependentes dele. Para tarefas que compartilham arquivos, delegue-as sequencialmente, uma de cada vez.

Se uma tarefa exigir alteração fora dos arquivos relevantes, mudar arquitetura, contradizer a TechSpec ou revelar que o achado está incorreto, pare e peça decisão humana antes de delegar.

## Revisão e retrabalho

Depois de cada tarefa implementada pelo subagente:

1. Inspecione as alterações e compare-as com o achado no `codereview.md`, cada requisito e cada critério de sucesso da tarefa.
2. Procure regressões em contratos, tratamento de erros, casos limite, segurança, concorrência, persistência, performance e padrões do projeto conforme o domínio da alteração.
3. Execute a menor validação automatizada que possa refutar a conclusão e, em seguida, os testes obrigatórios ou proporcionais ao risco da tarefa. Não declare sucesso sem registrar o resultado.
4. Se houver falha, implementação incompleta ou validação insuficiente, devolva a mesma tarefa ao executor com achados objetivos. Faça o retrabalho no mesmo escopo e repita a revisão e a validação.
5. Se não for possível validar por falta de dependência, ambiente, acesso ou reprodução, não conclua a tarefa. Registre o bloqueio, a evidência e a decisão necessária.
6. Só marque uma tarefa como concluída quando a implementação, os critérios e os testes estiverem aprovados.

## Conclusão de cada tarefa

Somente após a revisão e a validação aprovadas:

1. Crie `done/` dentro da pasta da code review, se ainda não existir.
2. Mova o `task_[num].md` concluído para `done/` sem renomeá-lo.
3. Não altere `codereview.md` para remover ou reclassificar o achado.
4. Registre no resultado da execução a tarefa, os arquivos alterados, as validações e qualquer observação relevante.
5. Recalcule as dependências e inicie o próximo lote elegível.

## Validação final

Quando não houver mais `task_[num].md` pendentes na raiz:

1. Execute a suíte de testes proporcional ao conjunto de correções, além das validações específicas já executadas.
2. Releia a seção de problemas do `codereview.md` e confirme que cada achado foi corrigido, testado e vinculado à tarefa correspondente.
3. Quando o ambiente permitir, execute novamente `executar-review` para gerar uma nova pasta de revisão. Compare o novo relatório com os achados originais e não declare conformidade se algum deles continuar pendente.
4. Se a nova revisão encontrar itens diferentes, preserve o novo relatório e informe que são pendências novas; não os misture com as tarefas já concluídas.
5. Considere o fluxo concluído somente quando:
   - todas as tarefas estiverem em `done/`;
   - cada correção tiver sido revisada e validada;
   - os testes finais exigidos passarem;
   - nenhum achado original permanecer sem justificativa;
   - bloqueios, limitações de ambiente e pendências novas estiverem documentados no resultado.

## Pausa para decisão humana

Pare antes de editar quando houver requisito ambíguo, conflito entre relatório e código, dependência circular, sobreposição não segura entre tarefas, mudança fora do escopo, falha não reproduzível, credencial, acesso ou aprovação necessária. Explique a tarefa afetada, a evidência, as alternativas e a decisão necessária. Não mova a tarefa para `done/` enquanto o bloqueio existir.

## Saída

Informe sempre:

- pasta da code review usada;
- tarefas executadas, retrabalhadas e movidas para `done/`;
- arquivos alterados;
- comandos e testes executados com seus resultados;
- bloqueios ou decisões pendentes;
- resultado da nova revisão, quando executada;
- pendências novas que não faziam parte do relatório original.
