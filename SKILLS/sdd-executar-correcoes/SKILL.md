---
name: sdd-executar-correcoes
description: Execução SDD quando há tasks de uma revisão a corrigir; implementa cada correção nesta sessão com exploradores somente leitura e segue entre tasks até o limiar de contexto; não cria nem reclassifica achados.
argument-hint: --prd nome-da-feature --num numero-da-revisao
disable-model-invocation: true
---

# Executar correções SDD

A sessão que executa esta skill é a única escritora: implementa cada task de correção ela mesma e é dona dos movimentos dentro da pasta da revisão. Subagentes são exploradores somente leitura; nunca editam arquivos, rodam build ou testes que escrevam em recursos compartilhados, nem falam com o usuário. A execução é uma task por vez; entre tasks a sessão segue sozinha até a pausa de sessão mandar parar. A sessão que corrige o código não emite a re-revisão.

Se o chamador limitar a execução a uma task, devolva após o passo 6 em vez de fazer a pausa de sessão: `task-concluida` com os próximos IDs elegíveis, ou `bloqueado` com evidências. Quando todas as tasks estiverem concluídas, execute o passo 7 antes de retornar. Retorno de task não encerra a revisão.

1. **Retomar.** Leia integralmente `references/continuidade-sessao.md` da skill `sdd-orquestrar-tasks` uma vez por sessão: sua medição de contexto vale em toda task. Se `tasks/prd-[slug]/snapshot-contexto.md` existir, aplique o protocolo de carga, validando `cobre_ate` contra a pasta da revisão.
   **Saída:** snapshot aplicado, parcialmente confiável com as entradas suspeitas nomeadas, ou ausente.
2. Fixe uma revisão por argumento, snapshot ou contexto e exija `codereview.md`. Inventarie tasks da raiz e `done/` por ID, achados, aceite, dependências e arquivos. Se ambígua, solicite escolha; se faltar plano, direcione a `sdd-planejar-correcoes`.
   **Saída:** revisão exata, sem duplicatas ou dependências ausentes/circulares. Se todas concluídas, siga ao passo 7.
3. Selecione uma task elegível com dependências concluídas, preferindo o `proximo_passo` do snapshot quando ainda for elegível. Confirme autorização de correção.
   **Saída:** uma task com achados, limites e entradas do snapshot que casam com ela carregadas.
4. Leia relatório estável e task uma vez por versão; depois recupere seções de PRD/TechSpec, código, instruções locais e skills pertinentes. Envie explorador somente leitura só para varreduras em muitos arquivos, como todos os callers de um símbolo nomeado num achado, e confira as linhas que ele citar. Rastreie a causa e implemente dentro dos limites. Aplique validação da TechSpec; em desktop C#/.NET, omita E2E inclusive em comandos legados. Registre unitários, integração, manual necessário e limitações; se disponível, use `dotnet-efficient-validation`. Rode os comandos bloqueantes do perfil de qualidade sobre os arquivos que a correção tocou: corrigir um achado sem reintroduzir outro é parte do aceite da task. Serialize build e testes que disputam `bin/`, `obj/` ou fixtures.
   Atualize somente a task e seu único `## Handoff` com resultado, arquivos, comandos, versão validada e pendências. Preserve relatório, outras tasks e estado global.
   **Saída:** implementação/evidência ou bloqueio reproduzível.
5. Releia diff e handoff contra achado, aceite e regras como se outro autor os tivesse escrito. Reuse testes comprovados do mesmo estado; execute apenas verificações faltantes/invalidadas. Corrija o que falhar; após duas tentativas sem evidência nova, registre bloqueio e avance nas independentes. Arquitetura/escopo divergente exige HIL quando não coberto por autorização existente.
   **Saída:** aceite da task comprovado ou pendência específica; manual essencial não executado impede aprovação.
6. Mova a task aprovada para `done/`, preservando o nome e verificando caminhos absolutos dentro da revisão. Preserve relatório imutável. Recalcule DAG pelos arquivos restantes. Depois, sem explorador ou processo em execução, faça a pausa de sessão de `continuidade-sessao.md` com etapa `correcoes`, `autoria_codigo: sim` e a próxima task elegível como próximo passo; no destino `Seguir`, volte ao passo 3.
   **Saída:** task aprovada movida, pendentes na raiz; próxima task iniciada, ou snapshot gravado antes da pergunta e escolha do usuário aplicada. Em interrupção, confira revisão/handoff antes de inferir conclusão pela pasta.
7. Valide o conjunto integrado sem repetir comandos já válidos. Confira todo achado acionável e sua evidência. A re-revisão roda numa sessão que não fez estas correções: no fluxo orquestrado, devolva relatório de execução para o chamador agendar `sdd-revisar-codigo`; em uso avulso, faça a pausa de sessão com `sdd-revisar-codigo` como próximo passo, o que recomenda encerrar esta sessão.
   **Saída:** tasks concluídas com evidência integrada e re-revisão deixada a uma sessão independente ou explicitamente entregue ao chamador; achados persistentes/novos permanecem abertos até decisão.

Se ambiente impedir aceite, mantenha task pendente com comando, erro e impacto. Alterações preexistentes ou alheias que colidam com os arquivos da task param a task até serem reconciliadas.