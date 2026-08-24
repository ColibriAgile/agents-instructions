---
name: sdd-planejar-refatoracao
description: Planeja uma refatoração SDD preservando comportamento observável sem implementar mudanças.
argument-hint: --slug nome-da-refatoracao [--atualizar]
disable-model-invocation: true
---

# Planejar refatoração SDD

Gere `prd.md` e `techspec.md` para uma mudança estrutural cujo contrato principal é preservar comportamento existente.

## Steps — refatoração

**Step 1: Fixar alvo e destino**

1. Identifique módulo, classe ou fluxo alvo e derive o slug; use `--slug` quando informado.
2. Resolva `tasks/prd-[slug]/prd.md` e `techspec.md` antes de escrever.
3. Se algum arquivo existir sem `--atualizar`, preserve ambos e informe os caminhos. Com atualização explícita, leia PRD e TechSpec existentes e preserve IDs estáveis.

*Done when:* alvo, limites, slug e operação estão definidos sem risco de sobrescrita.

**Step 2: Inventariar comportamento atual**

1. Rastreie entradas, saídas, erros, efeitos, callers, persistência, integrações e casos limite do código alvo.
2. Use testes, contratos, logs, roteiros e código atual como evidência; diferencie comportamento intencional, acidente aparente e lacuna.
3. Numere comportamentos a preservar como `R-01`, `R-02` e registre origem verificável.
4. Pergunte ao usuário somente quando intenção ou limite não puder ser provado e alterar o aceite.

*Done when:* todo comportamento dentro do escopo possui ID, evidência e forma de verificação ou pendência explícita.

**Step 3: Definir a rede de segurança**

1. Reuse testes existentes e adicione characterization tests somente para comportamento sem proteção.
2. Prefira asserções semânticas. Use snapshot ou Golden Master somente quando uma asserção menor não representar o resultado e depois de revisar o baseline para não congelar defeitos conhecidos.
3. Ordene etapas por dependência: caracterização necessária antes da mutação, fatias reversíveis antes dos consumidores e mudança irreversível somente após gate explícito.
4. Se o alvo usar WinForms ou DevExpress, leia `references/winforms-devexpress.md` desta skill na íntegra; ignore essa referência para outras stacks.

*Done when:* cada `R-NN` possui teste automatizado, verificação manual justificada ou pendência bloqueante, e o sequenciamento respeita dependências reais.

**Step 4: Gerar PRD e TechSpec**

1. Leia `assets/TEMPLATE_PRD_REFACTOR.md` e `assets/TEMPLATE_TECHSPEC_REFACTOR.md` desta skill na íntegra.
2. Preencha o PRD com comportamento, limites e aceite; mantenha arquitetura na TechSpec.
3. Preencha a TechSpec com decisões, componentes, etapas, test cases e rollback. Reuse IDs em atualização.
4. Crie ou atualize somente os dois arquivos autorizados; não altere código.

*Done when:* os dois artefatos cobrem todos os `R-NN`, não contêm placeholders e formam entrada válida para `sdd-planejar-tasks`.

**Step 5: Reportar o handoff**

1. Informe os arquivos, comportamentos preservados, lacunas e riscos.
2. Indique `sdd-planejar-tasks --prd [slug]` como próximo passo, sem executá-lo automaticamente.

*Done when:* o usuário consegue revisar os contratos e iniciar a decomposição sem recuperar o histórico da conversa.

## Error Handling

- Se o comportamento atual for contraditório, preserve as evidências e bloqueie somente os `R-NN` afetados.
- Se não houver forma proporcional de verificar um comportamento crítico, mantenha a refatoração pendente até definir a rede de segurança.
- Se a mudança incluir comportamento novo, separe-o em PRD de feature ou marque-o fora do escopo da refatoração.
