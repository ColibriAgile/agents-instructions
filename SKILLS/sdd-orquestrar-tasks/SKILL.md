---
name: sdd-orquestrar-tasks
description: DAG SDD quando PRD, TechSpec e tasks já estão aprovados e precisam ser executados; implementa cada task nesta sessão com exploradores somente leitura e segue entre tasks até o limiar de contexto. Para o ciclo desde PRD, use sdd-orquestrar-fluxo.
argument-hint: --prd nome-da-feature [--budget economico|medio|alto]
disable-model-invocation: true
---

# Orquestrar tasks SDD

A sessão que executa esta skill é a única escritora: implementa cada task ela mesma, seguindo `sdd-executar-task`, e é dona do manifesto e dos movimentos. Subagentes são exploradores somente leitura; nunca editam arquivos, rodam build ou testes que escrevam em `bin/`, `obj/` ou fixtures, nem falam com o usuário. A execução é uma task por vez; entre tasks a sessão segue sozinha até a pausa de sessão mandar parar. Esta sessão não emite a revisão global do código que escreveu.

Se o chamador limitar a execução a uma task, devolva após o passo 7 em vez de fazer a pausa de sessão: `task-concluida` com os próximos IDs elegíveis, ou `bloqueado` com evidências. Quando todas as tasks estiverem concluídas, execute o passo 8 antes de retornar. Retorno de task não significa conclusão da feature.

1. **Retomar.** Leia integralmente [references/continuidade-sessao.md](references/continuidade-sessao.md) uma vez por sessão: sua medição de contexto vale em toda task. Procure `tasks/prd-[slug]/snapshot-contexto.md`; se existir, aplique o protocolo de carga antes de qualquer outra coisa: valide o cabeçalho contra manifesto e Git, carregue a camada `agora` e guarde as demais camadas para seus gatilhos. Snapshot obsoleto ou inválido é pista, nunca autoridade.
   **Saída:** snapshot aplicado, parcialmente confiável com as entradas suspeitas nomeadas, ou ausente.
2. **Reconciliar.** Resolva a feature e confira `prd.md`, `techspec.md`, `tasks.md`, raiz e `done/`. Leia fontes uma vez por versão, depois metadados de tasks. Confirme autorização para implementar e registre alterações preexistentes para preservá-las.
   Se houver evidência de conclusão incorreta, reabra a task: registre motivo, revisão e handoff anterior em `Problemas e soluções`, mova de `done/` à raiz e atualize link/estado para pendente. Preserve contrato e IDs; revalide dependentes afetadas. Isso não autoriza regenerar tasks concluídas para mudar seu escopo.
   **Saída:** IDs, links, estados e dependências reconciliados; divergências têm evidência e bloqueiam a unidade afetada.
3. **Selecionar.** Escolha uma task pendente com dependências concluídas, preferindo o `proximo_passo` do snapshot quando ainda for elegível. Leia `sdd-executar-task` uma vez por sessão e siga-a como procedimento desta task.
   **Saída:** uma task com contrato, escopo de escrita e as entradas do snapshot que casam com ela carregadas.
4. **Explorar.** Antes de editar, liste as perguntas que a mudança precisa responder (callers, testes afetados, instruções locais, hits do Baseline do terreno, implementações semelhantes). Responda diretamente as pequenas e pontuais. Delegue uma pergunta a um subagente explorador somente leitura só quando respondê-la exigir varrer muitos arquivos ou diretórios e apenas a conclusão importar; rode perguntas disjuntas em paralelo. Dê a cada explorador a pergunta exata, os caminhos de partida, a restrição de somente leitura e o formato de retorno: conclusão, evidência `caminho:linha` e o que não conseguiu confirmar. Não envie conversa, PRD ou TechSpec, salvo quando a pergunta for sobre eles.
   **Saída:** pontos de mudança e alvos de teste conhecidos com evidência; conclusões de exploradores em que o trabalho vai se apoiar conferidas nas linhas citadas antes de editar.
5. **Implementar.** Aplique os passos 2 a 5 de `sdd-executar-task` nesta sessão: menor mudança coerente, testes de comportamento proporcionais ao risco, perfil de qualidade da TechSpec sobre os arquivos tocados e `## Handoff` atualizado com evidências. Serialize build e testes que disputam `bin/`, `obj/` ou fixtures. Desvios de escopo ou arquitetura param a task e vão ao usuário como decisão com alternativas e impacto.
   **Saída:** implementação limitada ao contrato, com verificações rodadas no estado atual.
6. **Revisar.** Releia o diff da task contra contrato, critérios de aceite, instruções locais e perfil de qualidade da TechSpec, como se outro autor o tivesse escrito. Reutilize validação comprovada do mesmo estado; rode novamente apenas por mudança, falha, risco não coberto ou exigência do projeto. Em desktop .NET, omita E2E e confira evidências substitutas; validação manual essencial pendente impede conclusão.
   Rode os comandos bloqueantes do perfil sobre o diff da task: é uma varredura de custo proporcional aos hits, não uma auditoria. Desconte o que o Baseline do terreno já registrava. Hit novo ou agravado, sem `DEC-NN` que o cubra, impede a conclusão mesmo com aceite e testes conformes. Acumule os hits de ressalva por feature para o gatilho de escalonamento, sem tratá-los como bloqueio. Com budget `alto` ou risco real, acrescente um explorador somente leitura que confere o diff contra os critérios de aceite e devolve lacunas com evidência; seus achados são insumo, não aprovação.
   Corrija os achados e revise de novo. Após duas tentativas sem progresso, registre bloqueio e siga para trabalho independente.
   **Saída:** task aprovada por evidência ou pendente com causa concreta; nenhuma task concluída com hit bloqueante não justificado.
7. **Registrar e seguir.** Mova a task aprovada para `done/`, verificando que origem/destino resolvidos estão dentro da feature. Atualize link e estado no manifesto e confira os dois. Registre problemas/soluções relevantes na cauda do manifesto. Recalcule o DAG. Em interrupção entre movimento e atualização, reconcilie usando handoff e revisão, sem presumir aprovação pela localização.
   Depois aguarde processos em segundo plano e exploradores terminarem e faça a pausa de sessão de [references/continuidade-sessao.md](references/continuidade-sessao.md) com etapa `tasks`, `autoria_codigo: sim` e a próxima task elegível como próximo passo; no destino `Seguir`, volte ao passo 3. Task bloqueada fica registrada e a execução segue pela próxima elegível; sem elegíveis, siga ao passo 8.
   **Saída:** arquivo, link e estado consistentes; próxima task iniciada, ou snapshot gravado antes da pergunta e escolha do usuário aplicada.
8. **Encerrar.** Quando não restarem elegíveis, confira todas as obrigações e a validação do conjunto integrado, serializando build e testes compartilhados. Reporte conclusão das tasks ou bloqueios; a revisão global pertence a `sdd-revisar-codigo`, numa sessão que não escreveu este código. Faça a pausa de sessão com `sdd-revisar-codigo` como próximo passo, o que recomenda encerrar esta sessão.
   **Saída:** todas concluídas e evidência integrada válida, ou pendências enumeradas; nenhuma alegação de feature aprovada apenas por tarefas movidas.

Sob `sdd-orquestrar-fluxo`, o chamador faz a pausa de sessão e imprime o próprio comando de retomada.

## Budget

Preserve modelo herdado por padrão. `economico`: exploradores só para varreduras que a sessão não resolve em poucas buscas; `medio`: exploradores paralelos para perguntas disjuntas; `alto`: também a conferência somente leitura do diff no passo 6. Troque modelo/capacidade apenas quando autorizado e disponível. Budget reduz trabalho redundante, nunca critérios de aceite.
