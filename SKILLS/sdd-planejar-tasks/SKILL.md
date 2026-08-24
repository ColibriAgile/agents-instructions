---
name: sdd-planejar-tasks
description: Planeja tasks SDD atômicas e rastreáveis sem implementar a feature.
argument-hint: --prd nome-da-feature [--atualizar]
disable-model-invocation: true
---

# Planejar tasks SDD

Converta PRD e TechSpec em contratos pequenos, rastreáveis e testáveis. Preserve as fontes e maximize o prefixo idêntico entre execuções na ordem `prd.md → techspec.md → task atual`.

## Steps — decomposição

**Step 1: Fixar fontes e destino**

1. Resolva o slug por `--prd`; na ausência do argumento, use a feature já identificada na sessão.
2. Exija `tasks/prd-[slug]/prd.md` e `tasks/prd-[slug]/techspec.md`.
3. Leia ambos integralmente uma vez, sempre na ordem PRD e TechSpec. Trate-os como imutáveis durante esta execução; reinicie o inventário se um deles mudar.
4. Verifique `tasks.md`, `task_*.md` e `done/task_*.md` depois desse prefixo. Sem `--atualizar`, preserve qualquer plano existente e pare informando seu caminho. Com `--atualizar`, inventarie IDs, links, estado e handoffs existentes antes de propor mudanças.
5. Mantenha perguntas, código recuperado, resultados de ferramentas e estado mutável depois das fontes estáveis.

*Done when:* as duas fontes corretas estão carregadas na ordem fixa e o destino está classificado como criação nova ou atualização explícita sem risco de sobrescrita.

**Step 2: Construir o inventário rastreável**

1. Extraia em uma única passagem requisitos funcionais e não funcionais, histórias, fora de escopo, decisões técnicas, componentes, contratos, integrações, riscos, observabilidade, migrações e cenários de teste.
2. Preserve IDs existentes. Para itens sem ID, atribua IDs locais estáveis por categoria (`US-01`, `NFR-01`, `CMP-01`, `TC-01`) e registre a seção de origem.
3. Associe cada item a componente afetado, evidência de conclusão e teste previsto. Marque como `pendente` somente contradições ou lacunas que alterem escopo, dependência ou aceite.
4. Em atualização, preserve o vínculo das obrigações inalteradas com tasks existentes e identifique somente adições, remoções ou impactos reais.
5. Quando faltar um caminho ou comando verificável, inspecione o menor trecho necessário do projeto sem redesenhar a TechSpec.

*Done when:* todo item das fontes aparece exatamente uma vez como mapeável ou pendente, com origem e verificação, e todo item previamente planejado foi reconciliado.

**Step 3: Formar entregas atômicas**

1. Prefira fatias verticais com comportamento observável. Crie fundação separada somente quando ela desbloquear duas ou mais entregas ou for uma migração reversível independente.
2. Faça cada task caber em uma revisão coerente: um resultado, escopo explícito, dependências conhecidas, implementação e testes correspondentes.
3. Separe resultados independentes; una preparação sem valor observável à primeira entrega que a consome.
4. Reuse IDs de tasks inalteradas. Numere novas tasks após o maior ID existente na raiz ou em `done/`, modele dependências como DAG e explicite o que cada task desbloqueia.
5. Mapeie toda task a pelo menos um item e todo item não pendente a pelo menos uma task. Preserve `fora de escopo` como limite.
6. Apresente o DAG, o impacto sobre arquivos existentes e a destinação de cada item; aguarde aprovação antes de escrever.

*Done when:* o DAG é acíclico, nenhuma task ou obrigação está órfã, tasks concluídas permanecem imutáveis e o usuário aprovou criação ou atualização.

**Step 4: Gerar os contratos**

1. Leia `assets/tasks.template.md` e `assets/task.template.md` desta skill na íntegra.
2. Grave `tasks/prd-[slug]/tasks.md` como fonte única do DAG, dos links e do estado.
3. Crie ou atualize somente os `task_[num].md` aprovados. Nunca sobrescreva uma task em `done/`; preserve IDs e handoffs existentes das tasks inalteradas.
4. Faça cada link do manifesto apontar para a localização real, na raiz ou em `done/`.
5. Referencie IDs, seções e caminhos das fontes. Repita apenas invariantes curtos e mantenha detalhes técnicos na TechSpec.
6. Mantenha contexto estável no início e estado mutável no final. Exclua timestamps e metadados voláteis.

*Done when:* cada entrada do manifesto aponta para um arquivo existente, os contratos seguem os templates e nenhum placeholder permanece fora do `Handoff` inicial das tasks novas.

**Step 5: Aplicar o gate de qualidade**

1. Execute uma rodada de crítica e corrija somente falhas observáveis nestes gates:
   - **Cobertura:** todos os itens não pendentes têm task e verificação.
   - **Rastreabilidade:** toda task aponta para PRD ou TechSpec por ID e seção.
   - **Dependências:** o DAG é acíclico e cada pré-condição tem dono.
   - **Atomicidade:** cada task entrega um resultado e inclui seus testes.
   - **Executabilidade:** caminhos, comandos, critérios e evidências são concretos.
   - **Cache-first:** PRD e TechSpec formam o prefixo; conteúdo variável fica na cauda.
   - **Idempotência:** rerun preserva IDs, tasks concluídas, links e handoffs.
2. Pare após todos os gates passarem ou quando restar uma decisão genuína. Liste pendências sem fabricar solução.
3. Apresente os arquivos gerados e aguarde aprovação antes de implementar.

*Done when:* os sete gates passam, ou cada bloqueio restante está ligado a uma pergunta concreta e às tasks afetadas.

## Error Handling

- Se faltar `prd.md`, direcione para `sdd-criar-prd`; se faltar `techspec.md`, direcione para `sdd-criar-techspec`.
- Se as fontes se contradisserem, preserve ambas, identifique as tasks afetadas e solicite a decisão mínima.
- Se manifesto, raiz e `done/` divergirem, pare a atualização e reporte cada link, ID ou estado inconsistente.
- Se uma obrigação não puder receber teste ou evidência, registre a lacuna antes de gerar a task correspondente.
