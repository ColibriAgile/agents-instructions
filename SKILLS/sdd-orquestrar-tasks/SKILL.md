---
name: sdd-orquestrar-tasks
description: DAG SDD quando PRD, TechSpec e tasks já estão aprovados e precisam ser executados; para o ciclo desde PRD, use sdd-orquestrar-fluxo.
argument-hint: --prd nome-da-feature [--budget economico|medio|alto]
disable-model-invocation: true
---

# Orquestrar tasks SDD

Se o chamador limitar a execução a um lote, devolva após o passo 5 antes de iniciar outro lote: `lote-concluido` com IDs pendentes se o lote foi aprovado, ou `bloqueado` com evidências se restou falha no lote ou nenhuma task é elegível. Quando todas as tasks estiverem concluídas, execute o passo 6 antes de retornar. Retorno de lote não significa conclusão da feature.

1. Resolva a feature e confira `prd.md`, `techspec.md`, `tasks.md`, raiz e `done/`. Leia fontes uma vez por versão, depois metadados de tasks. Confirme autorização para implementar e preserve alterações preexistentes.
   Se houver evidência de conclusão incorreta, reabra a task pelo dono do DAG: registre motivo, revisão e handoff anterior em `Problemas e soluções`, mova de `done/` à raiz e atualize link/estado para pendente. Preserve contrato e IDs; revalide dependentes afetadas. Isso não autoriza regenerar tasks concluídas para mudar seu escopo.
   **Saída:** IDs, links, estados e dependências reconciliados; divergências têm evidência e bloqueiam a unidade afetada.
2. Selecione tasks pendentes com dependências concluídas. Use um subagente executor por task; paralelize somente unidades sem colisão de arquivos, contratos, configuração ou recursos de build/teste. Reserve slots disponíveis e mantenha o orquestrador como único escritor do manifesto.
   **Saída:** lote com donos e escopos exclusivos. Sem subagentes disponíveis, reporte a limitação e execute sequencialmente se permitido pelo chamador.
3. Delegue `sdd-executar-task` com caminho da skill, task, fontes, autorização e limites de escrita. Use contexto mínimo, sem copiar histórico. Exija handoff com evidências e aguarde o handle real do executor.
   **Saída:** cada task retorna resultado ou bloqueio; executor não move arquivos nem altera manifesto.
4. Revise diff e handoff independentemente do autor contra contrato e testes. Reutilize validação comprovada do mesmo estado; rode novamente apenas por mudança, falha, risco não coberto ou exigência do projeto. Em desktop .NET, omita E2E e confira evidências substitutas; validação manual essencial pendente impede conclusão.
   Devolva apenas os achados ao mesmo executor. Após duas tentativas sem progresso, registre bloqueio e prossiga nas independentes. Desvios de escopo/arquitetura voltam ao HIL do chamador.
   **Saída:** cada task aprovada por evidência ou pendente com causa concreta.
5. Mova somente aprovadas para `done/`, verificando que origem/destino resolvidos estão dentro da feature. Atualize link e estado no manifesto e confira os dois. Registre problemas/soluções relevantes na cauda do manifesto. Recalcule DAG.
   **Saída:** arquivo, link e estado consistentes; em interrupção entre movimento e atualização, reconcilie usando handoff e revisão, sem presumir aprovação pela localização.
6. Quando não restarem elegíveis, confira todas as obrigações e a validação do conjunto integrado. Serializar build/testes evita disputa em `bin/` e `obj/`. Reporte conclusão das tasks ou bloqueios ao chamador; revisão global pertence a `sdd-revisar-codigo`.
   **Saída:** todas concluídas e evidência integrada válida, ou pendências enumeradas; nenhuma alegação de feature aprovada apenas por tarefas movidas.

## Budget

Preserve modelo herdado por padrão. `economico`: contexto e concorrência mínimos suficientes; `medio`: paralelismo independente útil; `alto`: revisão adicional somente para risco real. Troque modelo/capacidade apenas quando autorizado e disponível. Budget reduz trabalho redundante, nunca critérios de aceite.
