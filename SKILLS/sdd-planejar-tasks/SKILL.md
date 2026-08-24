---
name: sdd-planejar-tasks
description: Planeja tasks atômicas e rastreáveis a partir de PRD e TechSpec.
argument-hint: --prd nome-da-feature
disable-model-invocation: true
---

# Planejar tasks SDD

Converta PRD e TechSpec em contratos de execução pequenos, rastreáveis e testáveis. Preserve os documentos como fontes de verdade e maximize o prefixo idêntico entre execuções na ordem `prd.md → techspec.md → task atual`.

## Steps — decomposição

**Step 1: Fixar o prefixo de origem**

1. Resolva o slug por `--prd`; na ausência do argumento, use a feature já identificada na sessão.
2. Exija `tasks/prd-[slug]/prd.md` e `tasks/prd-[slug]/techspec.md`.
3. Leia ambos integralmente uma vez, sempre na ordem PRD e TechSpec. Trate-os como imutáveis durante esta execução; reinicie o inventário se um deles mudar.
4. Direcione estado mutável, perguntas e retornos de ferramentas para depois desse prefixo estável.

*Done when:* os dois documentos corretos estão carregados integralmente, na ordem fixa, e nenhuma fonte variável foi intercalada entre eles.

**Step 2: Construir o inventário rastreável**

1. Extraia em uma única passagem requisitos funcionais e não funcionais, histórias, fora de escopo, decisões técnicas, componentes, contratos, integrações, riscos, observabilidade, migrações e todos os cenários de teste.
2. Preserve IDs existentes como `RF1`. Para itens sem ID, atribua IDs locais estáveis por categoria (`US-01`, `NFR-01`, `CMP-01`, `TC-01`) e registre a seção de origem.
3. Associe cada item a componente afetado, evidência de conclusão e teste previsto. Marque como `pendente` apenas contradições ou lacunas que alterem escopo, dependência ou critério de aceite.
4. Quando faltar somente um caminho ou comando verificável, inspecione o menor trecho necessário do projeto e registre a evidência sem redesenhar a TechSpec.

*Done when:* todo item do PRD e da TechSpec aparece exatamente uma vez no inventário como mapeável ou pendente, com origem e verificação identificadas.

**Step 3: Formar entregas atômicas**

1. Prefira fatias verticais que entreguem comportamento observável. Crie uma tarefa de fundação somente quando ela desbloquear duas ou mais entregas ou representar uma migração reversível independente.
2. Faça cada tarefa caber em uma revisão coerente: um resultado, escopo explícito, dependências conhecidas, implementação e testes correspondentes. Inclua unitários, integração e E2E na tarefa que introduz o comportamento.
3. Separe tarefas quando houver resultados independentes; una preparação sem valor observável à primeira entrega que a consome.
4. Numere com IDs estáveis `T01`, `T02` e modele dependências como DAG. Ordene pré-requisitos antes dos consumidores e explicite o que cada tarefa desbloqueia.
5. Mapeie toda tarefa a pelo menos um item do inventário e todo item não pendente a pelo menos uma tarefa. Preserve `fora de escopo` como limite, não como backlog implícito.
6. Apresente ao usuário o DAG proposto, com títulos, resultados e dependências, e aguarde aprovação antes de gerar arquivos.

*Done when:* o DAG não contém ciclos ou tarefas órfãs, cada tarefa é implementável, revisável e verificável sem depender de trabalho não declarado, e o usuário aprovou a estrutura.

**Step 4: Gerar os contratos**

1. Leia `assets/tasks.template.md` e `assets/task.template.md` desta skill na íntegra.
2. Grave `tasks/prd-[slug]/tasks.md` como manifesto do DAG e da rastreabilidade.
3. Grave um `tasks/prd-[slug]/task_[num].md` por tarefa, com numeração de dois dígitos. Preencha todos os campos ou remova os opcionais sem aplicação.
4. Referencie IDs, títulos de seção e caminhos dos documentos de origem. Repita somente invariantes curtos indispensáveis à execução; mantenha decisões e detalhes técnicos na fonte canônica.
5. Mantenha contexto estável no início e estado mutável no final. Exclua timestamps e metadados voláteis dos contratos.

*Done when:* cada entrada do manifesto aponta para um arquivo existente, todos os arquivos seguem os templates e nenhum placeholder permanece.

**Step 5: Aplicar o gate de qualidade**

1. Execute uma rodada de crítica e corrija somente falhas observáveis nestes gates:
   - **Cobertura:** todos os itens não pendentes têm tarefa e verificação.
   - **Rastreabilidade:** toda tarefa aponta para PRD ou TechSpec por ID e seção.
   - **Dependências:** o DAG é acíclico e cada pré-condição tem dono.
   - **Atomicidade:** cada tarefa entrega um resultado e inclui seus testes.
   - **Executabilidade:** caminhos, comandos, critérios de aceite e evidências são concretos.
   - **Cache-first:** PRD e TechSpec formam o prefixo estável; conteúdo específico e estado ficam na cauda.
2. Pare após todos os gates passarem ou quando restar uma decisão genuinamente pendente. Liste pendências sem fabricar uma solução.
3. Apresente os arquivos gerados e aguarde aprovação antes de implementar qualquer tarefa.

*Done when:* os seis gates passam, ou cada bloqueio restante está ligado a uma pergunta concreta e a uma tarefa afetada.

## Error Handling

- Se faltar `prd.md`, pare e direcione para `sdd-criar-prd`; se faltar `techspec.md`, pare e direcione para `sdd-criar-techspec`.
- Se duas fontes se contradisserem em escopo, contrato ou aceite, preserve ambas como evidência, identifique as tarefas afetadas e solicite a decisão mínima necessária.
- Se um requisito não puder receber teste ou evidência observável, reporte a lacuna na especificação antes de gerar a tarefa correspondente.
