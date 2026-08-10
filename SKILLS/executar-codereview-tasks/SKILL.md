---
name: executar-codereview-tasks
description: 'Executa as tarefas task_[num].md geradas a partir de um code review, implementa as correções, valida cada resultado, faz retrabalho quando necessário e conclui com uma nova verificação da revisão.'
argument-hint: '--codereview caminho-da-pasta ou --num numero-da-revisao [--budget economico|medio|alto]'
disable-model-invocation: true
---

# Executar Tarefas de Code Review

Implemente e valide as tarefas de correção geradas pela skill `codereview-to-tasks` dentro de uma pasta `codereview_*`. A skill pode delegar tarefas a subagentes, mas mantém a revisão, a validação e a decisão de conclusão sob controle do agente principal.

A skill `orquestrar-tasks` é a referência para dependências, execução em lotes, delegação e retrabalho. Não a reutilize diretamente: tarefas de code review não exigem `prd.md`, `techspec.md` ou `tasks.md`, e o estado é controlado pela pasta `done/` da própria revisão.

## Quando usar

- Quando `codereview.md` já foi analisado e existem arquivos `task_[num].md` pendentes na pasta da revisão.
- Quando for necessário corrigir as não conformidades encontradas em um code review.
- Quando cada correção precisa ser implementada, testada e revisada antes de ser considerada concluída.

Não use para criar tarefas, executar QA sem um relatório de code review ou alterar o relatório original para esconder um achado.

## Entrada e seleção da revisão

Aceite:

- `--codereview <caminho>`: usa explicitamente a pasta informada.
- `--num <n>`: usa a pasta `codereview_<n>` encontrada no workspace.
- Sem argumento: localiza recursivamente pastas `codereview_*` com `codereview.md` e tarefas pendentes.
- `--budget economico|medio|alto`: ajusta o custo e a profundidade das delegações; o padrão é `economico`.

Sem entrada explícita, selecione a revisão pelo mesmo critério de `codereview-to-tasks`:

1. Considere diretórios `codereview_<n>` com sufixo numérico, `codereview.md` e pelo menos um `task_[num].md` na raiz.
2. Escolha o maior número de revisão.
3. Se não houver sufixo numérico válido, use a pasta cujo `codereview.md` tiver a modificação mais recente.
4. Nunca combine tarefas ou relatórios de pastas diferentes.

Se houver zero candidatos, mais de uma pasta não resolvida por esses critérios ou um caminho explícito inválido, pare e peça a decisão necessária antes de alterar arquivos.

## Pré-condições

1. Leia integralmente `codereview.md` e todos os `task_[num].md` pendentes na raiz da pasta selecionada. Ignore tarefas que já estejam em `done/`.
2. Confirme que cada tarefa contém objetivo, requisitos, subtarefas, critérios de sucesso, testes e arquivos relevantes. Se faltar informação essencial, registre o bloqueio e peça esclarecimento antes da implementação.
3. Relacione cada tarefa aos achados do relatório. Não execute uma tarefa que não possa ser vinculada a um achado ou requisito explícito.
4. Verifique o estado atual do repositório e preserve alterações existentes do usuário. Não reverta mudanças fora do escopo da tarefa.
5. Determine as dependências pela ordem indicada nas tarefas, pelos arquivos e contratos compartilhados e pela relação entre as correções. Quando a ordem não puder ser inferida com segurança, pare para decisão humana.

## Planejamento e execução

1. Para cada tarefa, extraia objetivo, arquivos permitidos, critérios de sucesso, testes obrigatórios, riscos e dependências.
2. Crie lotes de execução para delegar para subagentes. Só coloque tarefas no mesmo lote quando forem independentes e não alterarem os mesmos arquivos, contratos públicos, configurações compartilhadas, migrações ou ambiente de teste.
3. Antes de delegar, escolha o executor mais adequado entre os agentes configurados no workspace, considerando o domínio da tarefa, como .NET/C#, frontend, Delphi, migração ou hot path. Para tarefas pequenas e isoladas, execute diretamente.
   3.1. Se um executor tiver configuração de tools inválidas para o ambiente, apenas ignore essas tools ou se preferir gere uma cópia desse executor com as tools equivalentes no ambiente atual antes de executar.
4. Antes de cada lote:
    1. Escolha a melhor estrategia de execucao disponivel, em ordem de preferencia:
        - Executor paralelo nativo da ferramenta, quando o lote contiver mais de uma unidade de trabalho independente.
        - Subagentes nativos.
        - Sessoes independentes.
        - Execucao sequencial.
5. Para cada delegacao, selecione o modelo e nivel de reasoning proporcionais ao risco levando em consideração o budget informado em `--budget` (o padrão é economico)
    - para budget "economico" ou não informado, use gpt-5.6-luna ou sonnet com reasoning high a xhigh
    - para budget "medio", use gpt-5.6-luna ou sonnet com reasoning medio a xhigh até o gpt-5.6-terra ou opus com reasoning medio
    - para budget "alto", use modelos de custo mais alto e reasoning completo como gpt-5.6-terra ou opus com reasoning high ou xhigh
6. Ao delegar, informe sempre:
   - caminho absoluto da pasta da code review e do `task_[num].md`;
   - achado correspondente em `codereview.md`;
   - escopo, requisitos, critérios de sucesso e testes;
   - arquivos que podem ser alterados e restrições de coexistência;
   - instrução para implementar, validar e relatar arquivos, comandos, resultados e bloqueios.
7. Não aceite apenas análise ou uma sugestão: a delegação deve produzir a implementação e as validações cabíveis.
8. Aguarde todas as tarefas independentes do lote antes de iniciar tarefas dependentes. Para tarefas que compartilham arquivos, execute sequencialmente.
9. Se uma tarefa exigir alteração fora dos arquivos relevantes, mudar arquitetura, contradizer a TechSpec ou revelar que o achado está incorreto, pare e peça decisão humana.

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
3. Quando o ambiente permitir, execute novamente `execute-review` para gerar uma nova pasta de revisão. Compare o novo relatório com os achados originais e não declare conformidade se algum deles continuar pendente.
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
