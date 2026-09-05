---
name: sdd-planejar-correcoes
description: Correções SDD quando um code review precisa virar tasks rastreáveis; não implementa nem altera o relatório.
argument-hint: --prd nome-da-feature --num numero-da-revisao
disable-model-invocation: true
---

# Planejar correções SDD

1. Fixe uma única `tasks/prd-[slug]/codereview_[num]/` por argumento ou contexto. Busque somente valores ausentes; múltiplas candidatas exigem escolha. Exija e leia `codereview.md` uma vez; preserve-o.
   **Saída:** revisão exata e legível, sem misturar IDs entre relatórios.
2. Classifique todo item como acionável, informativo ou pendente. Em `APROVADO`, planeje só o solicitado; em `APROVADO COM RESSALVAS`, melhorias exigem escopo autorizado; em `REPROVADO`, cubra violações, incompletude e falhas. Status desconhecido permite somente achados explicitamente acionáveis.
   Preserve `CR-NN`; no legado sem IDs, atribua ID local por ordem e seção. Inventarie metadados da raiz e `done/` para reaproveitar tasks; identidade do achado é caminho da revisão + ID.
   **Saída:** todos os itens destinados; nenhum achado duplicado nem decisão inventada.
3. Confira evidências no menor trecho de código/TechSpec necessário. Agrupe só mesma causa com um resultado revisável. Modele DAG acíclico, limites, arquivos e testes; numere novas tasks após o maior número na raiz e `done/`.
   Para desktop C#/.NET, omita E2E; preserve obrigação com unitários, integração ou aceite manual pertinente. Ambiente/decisão ausente vira pendência explícita, não achado descartado.
   **Saída:** cada achado acionável tem task nova/existente, aceite e verificação; nenhuma task órfã.
4. Leia integralmente [references/TEMPLATE_TASK.md](references/TEMPLATE_TASK.md) ao gravar. Crie `task_[num].md` revisáveis com pelo menos dois dígitos, sem reutilizar números ou sobrescrever tasks existentes. Referencie fontes por ID/seção; preserve handoffs. Não crie manifesto de correções: dependências ficam nas tasks.
   **Saída:** contratos em disco, relatório intacto e nenhuma alteração de código.
5. Confira cobertura, rastreabilidade, DAG, atomicidade, comandos e idempotência. Informe arquivos, reaproveitamento, pendências e impacto. Devolva ao chamador; peça aprovação de execução apenas onde o escopo ainda não estiver autorizado.
   **Saída:** plano concreto para HIL ou execução já autorizada; contradições ligadas às tasks afetadas.

Task em `done/` cujo achado persiste é correção incompleta: mantenha histórico e retorne ao chamador para gerar trabalho na nova revisão. Relatório ilegível, numeração conflitante ou causa sem evidência bloqueia apenas o planejamento que dependa disso.
