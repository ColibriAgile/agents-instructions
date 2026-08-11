---
name: refactor-spec
description: Gera PRD e TechSpec de refatoração (SDD para refactor) em tasks/prd-[slug]/, no mesmo formato consumido pela skill criar-tasks. Foco em preservar comportamento em vez de definir comportamento novo. Use sempre que o usuário pedir para refatorar código existente, especialmente em projetos difíceis de testar E2E (Windows Forms, código legado, UI desktop). Também use quando o usuário mencionar "spec de refactor", "refatorar sem quebrar", "preservar comportamento", ou precisar planejar uma refatoração arquitetural (extrair serviço, mudar padrão de acesso a dados, separar lógica de UI) antes de tocar no código ou antes de rodar /criar-tasks. Não use para refactors mecânicos triviais (rename, extract method local) que não precisam de spec formal, nem para specs de feature nova (aí é o par criar-prd/criar-techspec padrão).
---

# Refactor Spec (SDD para Refatorações)

Gera o par `prd.md` + `techspec.md` de uma refatoração, em `tasks/prd-[slug]/`, no mesmo formato que a skill `criar-tasks` consome. A diferença em relação ao par PRD/TechSpec de feature nova é o foco: aqui "requisito" é comportamento existente que não pode mudar, não comportamento novo a construir.

## Quando usar

- Refatorações arquiteturais (extrair serviço, trocar padrão de acesso a dados, mover lógica entre camadas)
- Refatorações em código com cobertura de teste fraca ou impossível de testar E2E (WinForms, código legado)
- Refatorações de lógica financeira/crítica onde regressão silenciosa é cara
- Refatorações feitas por agente de IA (Claude Code), onde a spec funciona como grade de contenção
- Como preparação para rodar `/criar-tasks` num refactor

Não usar para: rename, extract method local, refactors de um único arquivo com boa cobertura de testes já existente — aí o teste + IDE já bastam. Também não usar para specs de feature nova (usar `criar-prd` + `criar-techspec` normalmente).

## Fluxo

1. **Definir o slug.** Se `--slug` não for passado, propor um a partir do nome do módulo/Form (ex: `refactor-pedido-form`). Confirmar com o usuário antes de criar a pasta.

2. **Levantar contexto do código-alvo.** Ler o código a ser refatorado (Form, classe, módulo). Identificar:
   - O que é lógica de negócio pura (extraível, testável)
   - O que é código-behind ligado a framework (WinForms/DevExpress: eventos, binding, controles)
   - Cobertura de testes atual (xUnit existente?)

3. **Perguntar ao usuário o que falta** (se não estiver claro pelo contexto):
   - Escopo exato e motivação
   - Existe suite de testes de caracterização já escrita, ou precisa ser criada do zero?
   - Há partes com binding "mágico" do DevExpress que merecem atenção especial?

4. **Gerar `prd.md`** em `tasks/prd-[slug]/` a partir de `assets/TEMPLATE_PRD_REFACTOR.md`. Cada requisito (Rn) deve ser um comportamento observável específico e verificável — não genérico.

5. **Gerar `techspec.md`** em `tasks/prd-[slug]/` a partir de `assets/TEMPLATE_TECHSPEC_REFACTOR.md`. Ponto crítico: a seção **Test cases** deve enumerar exaustivamente todo teste (automatizado ou manual) que verifica os requisitos do PRD — é essa tabela que a `criar-tasks` inventaria ao quebrar em tarefas. Cada test case referencia o ID do requisito correspondente.

6. **Ordenar o plano de execução por risco crescente** dentro da techspec: extrair lógica testável primeiro (baixo risco), mexer em code-behind/controles por último (alto risco). Isso mapeia diretamente na regra de ordenação por dependência que a `criar-tasks` já aplica.

7. **Reportar os arquivos gerados** e sugerir o próximo passo: rodar `/criar-tasks --prd [slug]` para quebrar em tarefas.

## Notas específicas para stack WinForms + DevExpress

- Separação de lógica: preferir um Presenter/MVP leve manual (sem framework extra) — extrair para uma classe `XxxPresenter` que recebe uma interface `IXxxView`, testável via NSubstitute mockando a view.
- Golden Master: para lógica que alimenta grids/relatórios, serializar (JSON) o output antes da refatoração e comparar programaticamente depois — mesmo sem testar a renderização. Isso vira um test case (tipo "Caracterização") na techspec.
- Controles DevExpress com comportamento implícito (auto binding, eventos automáticos) são pontos de maior risco de regressão silenciosa — mapear explicitamente na tabela de Componentes afetados.
- Roteiro de verificação manual é obrigatório para qualquer parte não extraível — vira test case do tipo "Manual" na techspec, não fica solto em lugar nenhum.

## Referência

- `assets/TEMPLATE_PRD_REFACTOR.md` — template do PRD
- `assets/TEMPLATE_TECHSPEC_REFACTOR.md` — template da TechSpec (contém a tabela de test cases que a `criar-tasks` consome)
