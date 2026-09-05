---
name: sdd-revisar-codigo
description: Revisão SDD quando é preciso auditar implementação contra PRD, TechSpec e tasks; não corrige achados.
argument-hint: --prd nome-da-feature [--base referencia-git]
---

# Revisar código SDD

1. Exija `prd.md`, `techspec.md` e `tasks.md` em `tasks/prd-[slug]/`. Leia PRD e TechSpec uma vez por versão; depois manifesto, tasks e handoffs. Confira todos os links, arquivos extras, IDs, estados e dependências.
   **Saída:** cada task tem localização e estado comprovados; fonte ausente bloqueia revisão com caminho exato.
2. Delimite implementação por `--base` resolvida para commit, incluindo mudanças commitadas, staged, unstaged e arquivos novos pertinentes. Sem base, use handoffs e worktree; explicite a limitação de escopo. Em re-revisão, inclua relatórios e handoffs de correções, sem alterar histórico.
   **Saída:** conjunto revisável identificado. Base inválida pede correção, nunca troca silenciosa de escopo.
3. Monte matriz de todas as obrigações: origem, implementação, teste, estado e evidência. Reuse IDs; leia detalhes de cada task conforme seus critérios, sem transcrever fontes. Marque `conforme`, `não conforme`, `pendente` ou `não verificável`.
   **Saída:** nenhuma obrigação órfã; tasks incompletas, links quebrados e aceite sem evidência permanecem lacunas.
4. Rastreie callers, efeitos, contratos, erros e riscos nos caminhos alterados; consulte regras/skills pertinentes. Confira comandos e resultados; reaproveite execução comprovada do mesmo código/configuração/ambiente, executando verificações faltantes ou invalidadas.
   Em desktop C#/.NET, omita E2E e registre a política, inclusive para comandos herdados. A omissão não é defeito nem teste aprovado; verifique evidências unitárias, integração e aceite manual que a TechSpec exigir. Manual essencial não executado é `não verificável`.
   **Saída:** estados sustentados por evidência ou limitação explícita; zero testes não prova aceite.
5. Numere achados `CR-01`, `CR-02` dentro desta revisão. Registre origem, fato, arquivo/símbolo/linha, impacto, severidade e evidência. Recomende correção só com causa comprovada. Identifique achado anterior por caminho da revisão + ID e marque resolvido, persistente ou não verificável.
   **Saída:** achados acionáveis distintos de melhorias opcionais; todos verificáveis sem histórico da conversa.
6. Leia integralmente [references/TEMPLATE.md](references/TEMPLATE.md) ao emitir relatório. Reserve o próximo sufixo numérico livre em `codereview_[num]/`, considerando todas as pastas existentes. Grave novo `codereview.md`; preserve código, tasks e relatórios anteriores.
   **Saída:** relatório imutável com matriz, achados, validações, limitações e status abaixo; informe caminho e bloqueios.

## Status

- `APROVADO`: todas as obrigações conformes, tasks concluídas, links íntegros e validações exigidas comprovadas.
- `APROVADO COM RESSALVAS`: apenas melhorias opcionais, sem requisito, segurança ou evidência essencial pendente.
- `REPROVADO`: qualquer obrigação não conforme/incompleta, estado inconsistente, teste obrigatório falhando ou evidência essencial ausente.

Se fontes/código mudarem durante a revisão, revalide a parte afetada antes do parecer. Falta de ambiente registra comando, erro e IDs afetados, sem converter ausência de evidência em aprovação.
