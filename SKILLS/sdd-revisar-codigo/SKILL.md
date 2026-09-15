---
name: sdd-revisar-codigo
description: Revisão SDD quando é preciso auditar implementação contra PRD, TechSpec e tasks, numa sessão que não escreveu esse código; não corrige achados.
argument-hint: --prd nome-da-feature [--base referencia-git]
---

# Revisar código SDD

Execute numa sessão que não escreveu nem alterou o código em revisão. Esta sessão consolida a matriz e grava o relatório; subagentes são exploradores somente leitura para inspeções disjuntas. Se esta sessão escreveu qualquer parte desse código, pare antes do passo 1 e faça a pausa de sessão de `references/continuidade-sessao.md` da skill `sdd-orquestrar-tasks`, que recomenda encerrar a sessão; se o usuário continuar mesmo assim, registre a falta de independência nas limitações do relatório.

1. Exija `prd.md`, `techspec.md` e `tasks.md` em `tasks/prd-[slug]/`. Quando `snapshot-contexto.md` existir, aplique seu protocolo de carga como etapa independente: só cabeçalho, resumo do próximo passo, pendências abertas e entradas `ao-executar`. Leia PRD e TechSpec uma vez por versão; depois manifesto, tasks e handoffs. Confira todos os links, arquivos extras, IDs, estados e dependências.
   **Saída:** cada task tem localização e estado comprovados; fonte ausente bloqueia revisão com caminho exato.
2. Delimite implementação por `--base` resolvida para commit, incluindo mudanças commitadas, staged, unstaged e arquivos novos pertinentes. Sem base, use handoffs e worktree; explicite a limitação de escopo. Em re-revisão, inclua relatórios e handoffs de correções, sem alterar histórico.
   **Saída:** conjunto revisável identificado. Base inválida pede correção, nunca troca silenciosa de escopo.
3. Monte matriz de todas as obrigações: origem, implementação, teste, estado e evidência. Reuse IDs; leia detalhes de cada task conforme seus critérios, sem transcrever fontes. Marque `conforme`, `não conforme`, `pendente` ou `não verificável`. Recortes disjuntos da matriz podem ir a exploradores somente leitura em paralelo, que devolvem estados com evidência `caminho:linha`; confira a evidência em que um achado vai se apoiar e não trate recorte sem achados como aprovação do todo.
   **Saída:** nenhuma obrigação órfã; tasks incompletas, links quebrados e aceite sem evidência permanecem lacunas.
4. Rastreie callers, efeitos, contratos, erros e riscos nos caminhos alterados, enviando exploradores só para varreduras em muitos arquivos; consulte regras/skills pertinentes. Confira comandos e resultados; reaproveite execução comprovada do mesmo código/configuração/ambiente, executando nesta sessão as verificações faltantes ou invalidadas e serializando as que disputam `bin/`, `obj/` ou fixtures.
   Rode todos os comandos do perfil de qualidade da TechSpec sobre o conjunto revisável, bloqueantes e ressalvas, e subtraia o Baseline do terreno: dívida que já existia antes da feature não é achado desta revisão, e tratá-la como tal esconde o que a implementação de fato introduziu. Conformidade com aceite e testes não substitui o perfil: um diff que atende todas as obrigações e ainda carrega hit bloqueante novo e não justificado tem defeito. TechSpec sem perfil de qualidade ou sem baseline é lacuna registrada nas limitações, não perfil vazio nem baseline zerado.
   Em desktop C#/.NET, omita E2E e registre a política, inclusive para comandos herdados. A omissão não é defeito nem teste aprovado; verifique evidências unitárias, integração e aceite manual que a TechSpec exigir. Manual essencial não executado é `não verificável`.
   **Saída:** estados sustentados por evidência ou limitação explícita; zero testes não prova aceite.
5. Numere achados `CR-01`, `CR-02` dentro desta revisão. Registre origem, fato, arquivo/símbolo/linha, impacto, severidade e evidência. Recomende correção só com causa comprovada. Identifique achado anterior por caminho da revisão + ID e marque resolvido, persistente ou não verificável.
   Hit bloqueante do perfil vira achado com a regra `QA-NN` como origem; hit de ressalva vira melhoria opcional com a mesma rastreabilidade. Conte as ressalvas da feature e, quando um gatilho do perfil disparar, registre na seção de escalonamento a skill pertinente e o número que a justifica — como sugestão ao HIL, nunca executada nesta revisão.
   **Saída:** achados acionáveis distintos de melhorias opcionais; todos verificáveis sem histórico da conversa; escalonamento sugerido apenas com gatilho contado.
6. Leia integralmente [references/TEMPLATE.md](references/TEMPLATE.md) ao emitir relatório. Reserve o próximo sufixo numérico livre em `codereview_[num]/`, considerando todas as pastas existentes. Grave novo `codereview.md`; preserve código, tasks e relatórios anteriores.
   Em uso avulso, faça a pausa de sessão; um snapshot gravado nela registra etapa `revisao`, o relatório em `cobre_ate`, `autoria_codigo: nao` e o status como pendência aberta. Como esta sessão não alterou código, ela pode seguir para `sdd-planejar-correcoes`.
   **Saída:** relatório imutável com matriz, achados, validações, limitações e status abaixo; informe caminho e bloqueios.

## Status

- `APROVADO`: todas as obrigações conformes, tasks concluídas, links íntegros, validações exigidas comprovadas e nenhum hit bloqueante do perfil de qualidade sem justificativa.
- `APROVADO COM RESSALVAS`: apenas melhorias opcionais, incluindo hits de ressalva do perfil, sem requisito, segurança ou evidência essencial pendente.
- `REPROVADO`: qualquer obrigação não conforme/incompleta, estado inconsistente, teste obrigatório falhando, evidência essencial ausente ou hit bloqueante do perfil não coberto por `DEC-NN`.

Se fontes/código mudarem durante a revisão, revalide a parte afetada antes do parecer. Falta de ambiente registra comando, erro e IDs afetados, sem converter ausência de evidência em aprovação.
