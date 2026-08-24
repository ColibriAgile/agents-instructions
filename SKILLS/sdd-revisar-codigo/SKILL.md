---
name: sdd-revisar-codigo
description: Revisa uma feature SDD contra PRD, TechSpec, tasks, código e testes sem corrigir achados.
argument-hint: --prd nome-da-feature [--base referencia-git]
---

# Revisar código SDD

Produza uma auditoria rastreável da feature. Separe evidência, impacto e recomendação; preserve a correção para `sdd-planejar-correcoes` e `sdd-executar-correcoes`.

## Steps — revisão

**Step 1: Fixar feature e fontes**

1. Resolva `--prd`; na ausência, use a feature já identificada na sessão.
2. Exija `tasks/prd-[slug]/prd.md`, `techspec.md` e `tasks.md`.
3. Leia as três fontes integralmente nesta ordem: PRD, TechSpec e manifesto. Trate-as como imutáveis durante a revisão.
4. Direcione tasks, código, diffs, testes e estado mutável para depois desse prefixo.

*Done when:* uma única feature e as três fontes estáveis estão carregadas na ordem fixa.

**Step 2: Delimitar tasks e implementação**

1. Siga cada link do manifesto e inventarie tasks na raiz e em `done/`; detecte links quebrados, arquivos extras, estados divergentes e dependências pendentes.
2. Leia integralmente todas as tasks concluídas e seus handoffs. Leia tasks pendentes o suficiente para registrar obrigações ainda não implementadas.
3. Se `--base` foi informado, use o diff até o estado atual como escopo primário. Sem base, derive o conjunto de arquivos dos handoffs e do worktree; registre como limitação qualquer implementação commitada que não possa ser delimitada.
4. Preserve alterações preexistentes e não modifique código, fontes SDD ou tasks.

*Done when:* toda task do manifesto tem localização e estado comprovados, e o conjunto de arquivos revisáveis possui origem ou limitação explícita.

**Step 3: Construir a matriz de cobertura**

1. Extraia requisitos, fora de escopo e critérios do PRD; decisões, contratos, riscos e test cases da TechSpec; subtarefas, aceite e handoffs das tasks.
2. Preserve IDs existentes e atribua ID local somente a obrigações sem identificador.
3. Associe cada obrigação a implementação, teste e evidência; marque `conforme`, `não conforme`, `pendente` ou `não verificável`.
4. Trate task pendente, link quebrado ou obrigação sem evidência como lacuna de completude, nunca como item aprovado por ausência de inspeção.

*Done when:* toda obrigação das fontes aparece exatamente uma vez na matriz com estado e evidência.

**Step 4: Verificar código e testes**

1. Leia integralmente as rules e skills aplicáveis apontadas pelas fontes ou pelo escopo real.
2. Rastreie callers, contratos e efeitos de cada caminho alterado; compare comportamento e erros com a matriz.
3. Execute os comandos de teste definidos nas tasks e a menor validação adicional capaz de refutar a implementação. Registre comando, resultado e limitações; meça cobertura somente quando o projeto a exigir e a ferramenta estiver disponível.
4. Numere achados como `CR-01`, `CR-02`. Para cada um, registre origem, fato observado, arquivo/símbolo/linha, impacto, severidade e evidência. Inclua recomendação somente quando a causa estiver comprovada.

*Done when:* cada estado da matriz e cada achado possui evidência reproduzível ou limitação explícita.

**Step 5: Classificar a revisão**

1. Use `APROVADO` somente quando todas as obrigações estiverem conformes, todas as tasks concluídas, links íntegros e testes exigidos passando.
2. Use `APROVADO COM RESSALVAS` somente para melhorias não bloqueantes sem requisito, contrato, segurança ou teste pendente.
3. Use `REPROVADO` para obrigação não conforme, task incompleta, link/estado inconsistente, teste exigido falhando ou evidência essencial ausente.

*Done when:* o status decorre mecanicamente da matriz, dos achados e das validações.

**Step 6: Gravar o relatório imutável**

1. Calcule o próximo sufixo numérico livre em `tasks/prd-[slug]/codereview_[num]/`; nunca reutilize uma pasta existente.
2. Leia `references/TEMPLATE.md` desta skill na íntegra e grave `codereview.md` sem placeholders.
3. Inclua a matriz, todos os achados, comandos, resultados, limitações e o status. Não altere relatórios anteriores.
4. Informe o caminho e a quantidade de itens por severidade e estado.

*Done when:* o novo relatório existe em pasta inédita, cada `CR-NN` é único e nenhuma evidência ou limitação usada no status ficou fora do arquivo.

## Error Handling

- Se uma fonte estável estiver ausente, pare e informe o caminho antes de revisar código.
- Se a base Git for inválida, preserve o erro e solicite outra referência; não substitua silenciosamente por escopo diferente.
- Se um teste não puder rodar, registre comando, erro e obrigações afetadas; classifique-as como não verificáveis.
- Se relatório e código se contradisserem durante uma re-revisão, registre o fato como novo achado; preserve o relatório anterior.
