---
name: sdd-criar-prd
description: PRD SDD quando solicitado criar ou atualizar requisitos de produto; não define arquitetura nem tasks.
argument-hint: --prompt "descrição da feature" [--atualizar]
disable-model-invocation: true
---

# Criar PRD SDD

1. Extraia problema, resultado e slug do pedido. Resolva `tasks/prd-[slug]/prd.md`; se existir, reutilize sem sobrescrever. Atualize apenas quando autorizado; preserve IDs inalterados.
   **Saída:** destino e operação inequívocos; solicite apenas a informação ausente que impeça identificá-los.
2. Inventarie usuários, jornadas, métricas, RF, RNF, restrições, dependências, acessibilidade e fora de escopo. Consulte evidência local antes de pesquisar regras públicas ou integrações em fontes primárias. Registre origem e diferencie fato, premissa e decisão de produto; pergunte apenas sobre lacunas que mudem escopo ou aceite.
   **Saída:** cada obrigação tem evidência ou premissa explícita; decisões bloqueantes estão identificadas.
3. Ao redigir, leia integralmente [assets/prd.template.md](assets/prd.template.md). Use IDs estáveis `RF-01`, `RNF-01`, `US-01` e aceite observável. Mantenha arquitetura e sequenciamento na TechSpec. Registre restrições de stack fornecidas sem presumir que todo repositório seja desktop.
   **Saída:** todas as seções aplicáveis preenchidas; IDs únicos; nenhum requisito sem aceite.
4. Grave somente o PRD e reporte caminho, pendências e obrigações adicionadas, alteradas ou removidas. Aponte derivados a revalidar sem editá-los. No fluxo orquestrado, devolva o artefato para HIL de produto; autorização anterior vale para o escopo que ela cobre.
   **Saída:** PRD revisável em disco; divergências de fontes e IDs conflitantes resolvidos ou explicitamente pendentes.

Leia cada fonte uma vez por versão; use links para evidências extensas. Em atualização, preserve seções inalteradas para reduzir diff e contexto.
