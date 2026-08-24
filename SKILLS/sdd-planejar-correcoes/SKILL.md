---
name: sdd-planejar-correcoes
description: Planeja correções SDD atômicas e rastreáveis sem alterar código ou review.
argument-hint: --prd nome-da-feature --num numero-da-revisao
disable-model-invocation: true
---

# Planejar correções SDD

Converta um `codereview.md` em contratos pequenos e testáveis. Preserve o relatório como fonte de verdade e use `codereview.md → task atual` como prefixo.

## Steps — decomposição

**Step 1: Selecionar e fixar a revisão**

1. Resolva `--prd` e `--num`; use primeiro a revisão identificada na sessão.
2. Restrinja candidatas conforme os argumentos: pasta exata com ambos, revisões da feature com `--prd`, mesmo número em qualquer feature com `--num`, ou todas quando ambos faltarem.
3. Considere somente `tasks/prd-*/codereview_[num]/` com sufixo numérico e `codereview.md` legível. Use a candidata única; se houver várias, apresente `<feature> / codereview_[num]` e aguarde escolha; se não houver nenhuma, pare.
4. Leia o relatório integralmente uma vez e reinicie o inventário se ele mudar.
5. Mantenha tasks existentes, código recuperado, perguntas e ferramentas depois dessa fonte estável. Nunca combine revisões.

*Done when:* uma única revisão foi informada e seu relatório está carregado integralmente antes de qualquer conteúdo variável.

**Step 2: Construir o inventário acionável e idempotente**

1. Extraia em uma passagem status, itens `NOK`, decisões não implementadas, tasks incompletas, testes falhando, problemas e recomendações.
2. Classifique cada item exatamente uma vez como `acionável`, `descartado` ou `pendente`. Descarte pontos positivos, itens `OK`/`SIM`/`COMPLETA` e recomendações informativas.
3. Aplique o status:
   - `APROVADO`: aceite somente o item pedido explicitamente pelo usuário;
   - `APROVADO COM RESSALVAS`: aceite ações técnicas claras;
   - `REPROVADO`: aceite violações, não aderências, incompletude e testes falhando;
   - ausente ou desconhecido: aceite somente achados explicitamente acionáveis.
4. Preserve IDs `CR-NN` do relatório. Se um relatório legado não tiver IDs, atribua `CR-01`, `CR-02` por ordem de aparição e registre a seção.
5. Depois do relatório, leia os metadados de tasks na raiz e em `done/`; marque cada `CR-NN` já coberto e não gere duplicata. Se o mesmo ID representar conteúdo divergente, registre pendência.
6. Confira evidências citadas lendo apenas o trecho necessário de código ou TechSpec; não implemente.

*Done when:* todo item do relatório possui uma classificação, todo `CR-NN` existente está reconciliado e cada item novo acionável tem origem e verificação.

**Step 3: Formar correções atômicas**

1. Agrupe achados somente quando tiverem a mesma causa, os mesmos arquivos e um único resultado verificável.
2. Faça cada task conter resultado, limites, dependências, correção e testes correspondentes.
3. Reserve o ID `TNN` pelo próximo número após o maior `task_[num].md` na raiz ou em `done/`; modele dependências como DAG e explicite o que cada task desbloqueia.
4. Mapeie toda task nova a ao menos um `CR-NN` ainda descoberto e cada achado acionável a uma task nova ou existente.
5. Apresente o DAG, o reaproveitamento de tasks existentes e a destinação de cada item; aguarde aprovação antes de escrever.

*Done when:* o DAG é acíclico, não há achado ou task órfã, nenhuma duplicata será criada e o usuário aprovou as novas tasks.

**Step 4: Gerar os contratos**

1. Leia `references/TEMPLATE_TASK.md` desta skill na íntegra.
2. Reconfirme o maior número na raiz e em `done/`; nunca reutilize ou sobrescreva um arquivo.
3. Grave somente as novas `task_[num].md` aprovadas na raiz da revisão, com dois dígitos.
4. Referencie IDs, seções e caminhos do relatório, TechSpec e rules/skills aplicáveis; recupere detalhes técnicos sob demanda.
5. Preserve o `Handoff` inicial do template para a execução. Exclua timestamps e metadados voláteis.
6. Preserve `codereview.md`, não crie `tasks.md`, não mova arquivos e não altere código.

*Done when:* cada task nova possui arquivo, número e IDs únicos, segue o template e não contém placeholders fora do `Handoff` inicial.

**Step 5: Aplicar o gate de qualidade**

1. Execute uma rodada de crítica nestes gates:
   - **Cobertura:** todo achado acionável tem task nova ou existente e verificação.
   - **Rastreabilidade:** toda task aponta para `CR-NN`, seção e, quando aplicável, TechSpec.
   - **Dependências:** o DAG é acíclico e cada pré-condição tem dono.
   - **Atomicidade:** cada task corrige uma causa e inclui seus testes.
   - **Executabilidade:** caminhos, aceite, comandos e evidências são concretos.
   - **Cache-first:** relatório estável primeiro; task e estado na cauda.
   - **Idempotência:** rerun não duplica achado nem número.
2. Pare quando os gates passarem ou restar decisão genuína; liste pendências sem fabricar solução.
3. Informe pasta, status, arquivos novos, cobertura por tasks existentes e itens não convertidos. Aguarde aprovação antes de executar.

*Done when:* os sete gates passam, ou cada bloqueio restante está ligado a uma pergunta e às tasks afetadas.

## Error Handling

- Se `codereview.md` estiver ausente, vazio ou ilegível, pare sem criar arquivos.
- Se relatório, código ou TechSpec se contradisserem, preserve evidências e solicite a decisão mínima.
- Se um achado não puder receber teste ou evidência, mantenha-o pendente.
- Se tasks existentes tiverem IDs, links ou numeração conflitantes, reconcilie o estado antes de gerar outra task.
