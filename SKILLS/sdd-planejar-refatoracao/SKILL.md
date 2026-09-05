---
name: sdd-planejar-refatoracao
description: Refatoração SDD quando é preciso planejar mudança estrutural preservando comportamento; não implementa nem adiciona funcionalidade.
argument-hint: --slug nome-da-refatoracao [--atualizar]
disable-model-invocation: true
---

# Planejar refatoração SDD

1. Fixe alvo, limites e slug. Resolva `tasks/prd-[slug]/prd.md` e `techspec.md`. Preserve ambos se existirem sem autorização de atualização; com ela, leia as versões atuais e mantenha IDs.
   **Saída:** operação inequívoca sem sobrescrita implícita.
2. Rastreie entradas, saídas, erros, efeitos, callers, persistência, integrações e bordas do alvo. Use código, testes, logs e contratos como evidência. Numere comportamentos `R-01`, `R-02`; diferencie intenção, defeito aparente e lacuna.
   **Saída:** todo comportamento no escopo tem origem e verificação ou pergunta concreta que altere aceite.
3. Planeje caracterização apenas para comportamento sem proteção; prefira asserções semânticas. Golden Master/snapshot exige baseline revisado. Sequencie caracterização antes da mutação e fatias reversíveis antes de mudanças irreversíveis.
   Para WinForms/DevExpress, leia integralmente [references/winforms-devexpress.md](references/winforms-devexpress.md). Em qualquer desktop C#/.NET, omita E2E; registre projetos/runner e comandos existentes de unitários/integração, mais roteiro manual para comportamento visual não coberto. Registre ambiente indisponível como pendência.
   **Saída:** cada `R-NN` tem rede de segurança proporcional e sequência segura; comportamento novo separado do escopo.
4. Ao redigir, leia integralmente [assets/TEMPLATE_PRD_REFACTOR.md](assets/TEMPLATE_PRD_REFACTOR.md) e [assets/TEMPLATE_TECHSPEC_REFACTOR.md](assets/TEMPLATE_TECHSPEC_REFACTOR.md). Grave apenas os dois artefatos: comportamento/aceite no PRD; decisões, componentes, testes e rollback na TechSpec. Referencie IDs sem copiar requisitos.
   **Saída:** documentos cobrem todos os `R-NN`, sem placeholders, e servem a `sdd-planejar-tasks`.
5. Reporte caminhos, riscos, lacunas e impactos em derivados. Em uso avulso, indique planejamento de tasks; no fluxo orquestrado, devolva para HIL de comportamento antes de decompor.
   **Saída:** contratos revisáveis, sem alteração de código nem promoção silenciosa de decisões.

Leia fontes uma vez por versão e código apenas no escopo. Contradição de comportamento ou ausência de verificação crítica bloqueia os itens afetados até decisão humana; preserve evidências.
