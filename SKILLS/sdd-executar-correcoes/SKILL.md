---
name: sdd-executar-correcoes
description: Execução SDD quando há tasks de uma revisão a corrigir; não cria nem reclassifica achados.
argument-hint: --prd nome-da-feature --num numero-da-revisao
disable-model-invocation: true
---

# Executar correções SDD

Se o chamador limitar a execução a um lote, devolva após o passo 5 antes de iniciar outro lote: `lote-concluido` com IDs pendentes se o lote foi aprovado, ou `bloqueado` com evidências se restou falha no lote ou nenhuma task é elegível. Quando todas as tasks estiverem concluídas, execute o passo 6 antes de retornar. Um lote não encerra a revisão.

1. Fixe uma revisão por argumento/contexto e exija `codereview.md`. Inventarie tasks da raiz e `done/` por ID, achados, aceite, dependências e arquivos. Se ambígua, solicite escolha; se faltar plano, direcione a `sdd-planejar-correcoes`.
   **Saída:** revisão exata, sem duplicatas ou dependências ausentes/circulares. Se todas concluídas, siga à validação conjunta.
2. Selecione tasks elegíveis. Delegue uma task por subagente com esta skill, caminho exato e instrução de executar **somente o passo 3**, sem delegar, revisar ou mover arquivos. O coordenador executa passos 1, 2 e 4 a 6. Em uso sem subagentes, execute sequencialmente e mantenha revisão separada do autor.
   Paralelize só sem colisão de arquivos, contratos, configuração e recursos de teste.
   **Saída:** lote com donos exclusivos e autorização de correção confirmada.
3. No executor, leia relatório estável e task uma vez por versão; depois recupere seções de PRD/TechSpec, código e skills pertinentes. Rastreie a causa e implemente dentro dos limites. Aplique validação da TechSpec; em desktop C#/.NET, omita E2E inclusive em comandos legados. Registre unitários, integração, manual necessário e limitações; se disponível, use `dotnet-efficient-validation`.
   Atualize somente a task atribuída e seu único `## Handoff` com resultado, arquivos, comandos, versão validada e pendências. Preserve relatório, outras tasks e estado global.
   **Saída:** implementação/evidência ou bloqueio reproduzível; executor retorna ao coordenador.
4. Revise diff e handoff independentemente do autor. Reuse testes comprovados do mesmo estado; execute apenas verificações faltantes/invalidadas. Devolva achados ao mesmo executor; após duas tentativas sem evidência nova, registre bloqueio e avance nas independentes. Arquitetura/escopo divergente exige HIL quando não coberto por autorização existente.
   **Saída:** aceite de cada task comprovado ou pendência específica; manual essencial não executado impede aprovação.
5. Mova somente aprovadas para `done/`, preservando nomes e verificando caminhos absolutos dentro da revisão. Preserve relatório imutável. Recalcule DAG pelos arquivos restantes.
   **Saída:** toda task aprovada movida; pendentes na raiz. Em interrupção, confira revisão/handoff antes de inferir conclusão pela pasta.
6. Valide o conjunto integrado sem repetir comandos já válidos. Confira todo achado acionável e sua evidência. No fluxo orquestrado, devolva relatório de execução para o chamador delegar `sdd-revisar-codigo`; em uso avulso, solicite revisão independente por essa skill e gere novo relatório imutável.
   **Saída:** tasks concluídas com evidência integrada e re-revisão emitida ou explicitamente entregue ao chamador; achados persistentes/novos permanecem abertos até decisão.

Se ambiente impedir aceite, mantenha task pendente com comando, erro e impacto. Se houver colisão, pare escritores afetados, aguarde confirmação de término e reconcilie mudanças antes de retomar sequencialmente.
