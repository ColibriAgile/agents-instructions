---
name: sdd-prd
description: PRD — Documento de Requisitos de Produto. Use quando o usuário pedir um PRD ou quiser definir requisitos e escopo de uma nova feature ou produto (primeira etapa do fluxo PRD → TechSpec → tasks). Não use para especificação técnica (sdd-techspec) nem para decompor em tarefas (sdd-tasks).
argument-hint: --prompt "descrição da feature"
disable-model-invocation: true
---

O PRD define **o quê e o porquê** — resultados, restrições e escopo, em afirmações mensuráveis. O _como_ (arquitetura, código) pertence à TechSpec: mantenha implementação fora do PRD.

## Fluxo de Trabalho

1. **Esclarecer** — pergunte ao usuário (use a tool de perguntas) antes de redigir:
   - Problema a resolver e metas mensuráveis
   - Usuários principais, histórias e fluxos
   - Funcionalidade central: entradas, saídas e ações
   - O que fica fora do escopo e dependências
   - Diretrizes de UI/UX e acessibilidade

   Regras de negócio do domínio: pesquise na web em vez de perguntar ao usuário.
   _Pronto quando:_ cada seção do template tiver resposta ou premissa registrada.

2. **Redigir** — leia `./TEMPLATE.md` desta skill na íntegra e siga sua estrutura exatamente.
   _Pronto quando:_ toda seção do template estiver preenchida com conteúdo específico da feature.

3. **Salvar e reportar** — grave em `./tasks/prd-[nome-da-feature]/prd.md` (kebab-case) e informe o caminho com um resumo de uma linha.
