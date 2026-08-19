---
name: sdd-techspec
description: TechSpec — especificação técnica derivada de um PRD existente. Use quando o usuário pedir uma techspec ou a arquitetura de uma feature que já tem PRD em tasks/prd-*/prd.md. Não use sem PRD (sdd-prd) nem para decompor em tarefas (sdd-tasks).
argument-hint: --prd nome-da-feature
---

Entrada: `--prd` identifica o slug da feature; sem argumento, deduza o slug pelo contexto da sessão atual (feature em discussão, PRD recém-criado, pasta já referenciada etc.) e só então localize a pasta em `./tasks/prd-*/`. PRD obrigatório em `tasks/prd-[slug]/prd.md` — se não existir, pare e aponte `/sdd-prd`.

A TechSpec define **o como** — arquitetura, componentes, contratos e testes. O quê/porquê já está no PRD: referencie-o em vez de repeti-lo. Especifique sem implementar: código apenas nos exemplos de interface do template. Prefira arquitetura simples e evolutiva, com interfaces claras.

## Fluxo

1. **Analisar o PRD** — leia-o por completo; extraia requisitos, restrições e métricas de sucesso.

2. **Explorar o projeto** — use o agente Explore antes de perguntar qualquer coisa ao usuário: arquivos e módulos afetados, interfaces e pontos de integração, quem chama/é chamado, configs, persistência, tratamento de erros, testes e infra existentes. Avalie reutilizar bibliotecas e classes existentes versus construir. Pesquise na web a documentação das bibliotecas envolvidas e as regras de negócio em aberto.
   _Pronto quando:_ der para nomear cada componente novo ou modificado e onde ele se encaixa no código atual.

3. **Esclarecer** — pergunte ao usuário (use a tool de perguntas) antes de redigir, focando no que a exploração não respondeu: limites de domínio, fluxo de dados e contratos, dependências externas (modos de falha, timeouts, idempotência), interfaces principais, cenários de teste críticos.
   _Pronto quando:_ toda pergunta tiver resposta ou premissa explícita.

4. **Redigir** — leia `./TEMPLATE.md` desta skill na íntegra e siga sua estrutura exatamente. Em "Conformidade com skills", verifique as skills do projeto e registre desvios com justificativa. Em "Abordagem de testes", enumere test cases que cubram todos os caminhos críticos (meta: >80% de cobertura).
   _Pronto quando:_ toda seção do template estiver preenchida e cada componente do passo 2 estiver especificado.

5. **Salvar e reportar** — grave em `tasks/prd-[slug]/techspec.md` e informe o caminho com um resumo de uma linha.
