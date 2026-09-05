---
name: sdd-executar-task
description: Execução de uma task SDD exata, avulsa ou delegada; não planeja nem aprova o próprio trabalho.
argument-hint: --task tasks/prd-nome/task_01.md
---

# Executar uma task SDD

1. Resolva uma única `tasks/prd-[slug]/task_[num].md`. Exija PRD, TechSpec e manifesto da feature. Leia fontes estáveis uma vez por versão na ordem PRD, TechSpec, task; consulte estado depois. Confirme dependências concluídas e task pendente. Task em `done/` é apenas reportada.
   **Saída:** contrato exato, dependências satisfeitas e escopo de escrita identificado.
2. Leia instruções locais e somente skills pertinentes à mudança. Inspecione worktree, callers e testes afetados; preserve alterações preexistentes. Mapeie todo aceite a implementação e evidência.
   **Saída:** pontos de mudança conhecidos; conflitos de fontes ou de escrita retornados ao chamador antes da mutação.
3. Implemente a menor mudança coerente e testes de comportamento proporcionais ao risco. Marque subtarefas só com evidência. Edite apenas arquivos atribuídos e a própria task; reserve manifesto e movimentos para o chamador.
   **Saída:** implementação limitada ao contrato, sem estado global alterado.
4. Aplique o perfil da TechSpec. Em desktop C#/.NET, omita E2E, inclusive quando comando legado os incluir: selecione projetos/filtros sem E2E e registre a divergência. Preserve aceite com unitários, integração e roteiro manual pertinente; manual não executado permanece pendente. Se disponível, use `dotnet-efficient-validation` para runner e reutilização de build.
   Execute as verificações necessárias ao diff; reúse evidência somente do mesmo código, configuração e ambiente. Zero testes ou listagem não são sucesso. Registre falhas preexistentes separadamente.
   **Saída:** cada aceite tem evidência ou bloqueio reproduzível.
5. Atualize um único `## Handoff`: resultado, arquivos, comandos, resultados, versão validada e pendências. Retorne resumo curto e caminho para revisão independente; em retry, altere a mesma seção e preserve evidências válidas.
   **Saída:** handoff suficiente para o chamador revisar diff, testes e aceite; task permanece na raiz até aprovação.

## Decisões e falhas

- Registre candidata a ADR só para decisão duradoura com alternativas e trade-off que governe contratos, fronteiras ou atributos de qualidade. Use `TXX-ADR-NN`, título, contexto, decisão, alternativas, consequências, evidência e relação com TechSpec; caso contrário, `Nenhuma`. A promoção ocorre depois de QA.
- Desvio arquitetural ou de escopo exige decisão humana, salvo autorização existente que o cubra. Registre o conflito e devolva ao chamador; não invente aprovação.
- Ambiente indisponível ou dependência pendente mantém aceite afetado sem marcar; retorne comando/erro/impacto. Retry corrige somente a falha; após duas tentativas sem evidência nova, devolva bloqueio para decisão.
