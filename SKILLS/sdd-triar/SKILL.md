---
name: sdd-triar
description: Triagem SDD que recomenda ao humano o nível de processo de um pedido de feature, correção ou refatoração — SDD completo, SDD enxuto ou ajuste pontual — por sinais de risco com evidência, antes de qualquer artefato. Use ao iniciar sdd-orquestrar-fluxo numa feature sem checkpoint ou quando perguntarem se um pedido vale o fluxo SDD. Não use para retomar feature com checkpoint nem para recortar pedido amplo em vários PRDs (use sdd-orquestrar-prds).
argument-hint: --prompt "descrição do pedido"
---

# Triar pedido para SDD

A triagem gasta pouco para evitar gastar muito: levanta sinais com evidência, aplica uma rubrica e recomenda um nível; o humano decide. Orçamento: até dez buscas ou leituras pontuais, sem build nem testes. Triagem que precisa de mais que isso para entender o pedido já indica `sdd-completo`.

| Nível | Caminho |
| --- | --- |
| `sdd-completo` | `sdd-orquestrar-fluxo` com todos os gates |
| `sdd-enxuto` | `sdd-orquestrar-fluxo` com PRD curto (problema, RF com aceite, fora de escopo), HIL 1 e HIL 2 fundidos numa só decisão, plano de uma a duas tasks e revisão independente mantida |
| `pontual` | Ramo pontual desta skill, fora do SDD |

1. **Entender.** Extraia tipo (feature, correção, refatoração), resultado principal e comportamento esperado. Com checkpoint existente para o pedido, pare e retome por `sdd-orquestrar-fluxo`. Com mais de um resultado principal, recomende `sdd-completo` por `sdd-orquestrar-prds` e siga ao passo 4.
   **Saída:** pedido com um resultado principal identificado, ou encaminhamento de retomada ou recorte.
2. **Levantar sinais.** Leia as instruções locais (`CLAUDE.md`, `AGENTS.md`) para áreas críticas, skills de risco e comandos. Localize os pontos de mudança prováveis pelo grafo de contexto do repositório quando houver um (ex.: `graft ask`, `graft callers <símbolo> --depth 2`), ou por busca direta. Preencha cada sinal com evidência `caminho:linha` ou `não medido`:

   | Sinal | Pergunta |
   | --- | --- |
   | S1 Contrato público | Altera o que um consumidor envia ou recebe: rota ou payload de API, DTO serializado, schema ou script de banco, formato de arquivo ou configuração? Mudança só em texto de documentação (descrição, exemplo, agrupamento) conta como ausente. |
   | S2 Área crítica | Toca área que as instruções locais declaram crítica ou que exige skill de risco (ex.: caixa, vendas, pagamento, fiscal, autenticação, bloqueios)? |
   | S3 Concorrência | Envolve transação, bloqueio, idempotência, fila ou estado compartilhado? |
   | S4 Raio de impacto | Quantos arquivos de produção, módulos e callers transitivos mudam de comportamento? |
   | S5 Decisão aberta | Há requisito ambíguo ou decisão de produto sem resposta? |
   | S6 Obrigações | Quantos comportamentos observáveis distintos o pedido exige? |
   | S7 Testes | Existem testes que exercem o comportamento, ou cabe um teste de regressão direto? |
   | S8 Reversibilidade | Persiste dado, migra estado ou dispara ação externa difícil de desfazer? |

   **Saída:** todo sinal preenchido com evidência ou `não medido`.
3. **Recomendar.** Aplique a rubrica, cujos limiares são ponto de partida calibrável pelo log de triagem:
   - `sdd-completo` quando qualquer um vale: S1, S2 com mudança de comportamento, S5, S8, S6 acima de três obrigações ou S4 em mais de um módulo.
   - `pontual` quando todos valem: um módulo, até três arquivos de produção, nenhum de S1, S2, S3, S5 ou S8, comportamento esperado inequívoco e teste de regressão viável (S7).
   - `sdd-enxuto` nos demais casos.
   Sinal `não medido` que decidiria o nível conta como presente.
   **Saída:** nível da rubrica com os sinais decisivos.
4. **HIL 0.** Apresente o nível que a rubrica recomenda, os sinais decisivos com evidência e o que cada nível custa em artefatos, HILs e revisão. Pergunte com a ferramenta de pergunta disponível, recomendado primeiro. Silêncio mantém a decisão pendente. Acrescente uma linha a `tasks/triagem-log.jsonl` com data, pedido resumido, sinais, nível da rubrica e decisão humana.
   **Saída:** nível decidido pelo humano e registrado.
5. **Seguir.** `sdd-completo` e `sdd-enxuto` voltam a `sdd-orquestrar-fluxo`, que registra a triagem como decisão em `workflow.md`; em `sdd-enxuto`, registre também a fusão de HIL 1 e HIL 2 como modificação de paradas. `pontual` segue o ramo abaixo.
   **Saída:** próximo passo iniciado no caminho decidido.

## Ramo pontual

1. **Implementar.** Faça a menor mudança coerente com teste de regressão que falha antes e passa depois, ou teste de comportamento quando não houver defeito. Valide com as skills de validação do repositório.
   **Saída:** mudança aplicada e teste com resultado registrado antes e depois.
2. **Alarme.** Pare e volte ao passo 2 com a evidência nova quando o diff passar do limite de arquivos decidido no HIL 0 (padrão: três de produção), tocar S1, S2, S3 ou S8, ou surgir decisão de produto. A mudança feita permanece no worktree como evidência; descartá-la é decisão humana.
   **Saída:** diff conferido dentro do limite, ou triagem reaberta com a evidência nova.
3. **Revisar.** Revise o diff com a skill de revisão do repositório ou a revisão nativa do host.
   **Saída:** achados da revisão corrigidos ou levados ao humano.
4. **Entregar.** Faça commit só quando pedido, pela skill `commit`.
   **Saída:** entrega no estado pedido, com teste de regressão e revisão como evidência.
