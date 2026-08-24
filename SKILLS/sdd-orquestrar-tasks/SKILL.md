---
name: sdd-orquestrar-tasks
description: Orquestra uma feature SDD completa; execução isolada pertence a sdd-executar-task.
argument-hint: --prd nome-da-feature [--budget economico|medio|alto]
disable-model-invocation: true
---

# Orquestrar uma feature SDD

Coordene o DAG, delegue cada unidade a `sdd-executar-task` e mantenha revisão e estado global no orquestrador.

## Steps — orquestração

**Step 1: Fixar a feature e o estado**

1. Resolva `--prd` para uma única pasta `tasks/prd-[slug]/`; na ausência, use a feature já identificada na sessão.
2. Exija e leia integralmente `prd.md`, `techspec.md` e `tasks.md` antes das tasks pendentes.
3. Relacione cada entrada do manifesto ao link e arquivo real na raiz ou em `done/`; confronte ID, estado e dependências.
4. Preserve mudanças preexistentes do usuário fora do escopo da feature.

*Done when:* cada entrada aponta para um arquivo existente, cada arquivo pertence ao manifesto e toda divergência está corrigida ou vinculada a uma decisão humana.

**Step 2: Formar o próximo lote**

1. Monte o DAG a partir das dependências declaradas e confirme colisões por arquivos, contratos, configuração e ambiente de teste.
2. Selecione somente tasks pendentes cujas dependências estejam concluídas.
3. Use execução sequencial como baseline. Forme lote paralelo apenas com duas ou mais tasks realmente independentes e um executor isolado disponível para cada uma.
4. Aplique o budget da referência abaixo sem fixar fornecedor ou modelo; escolha a capacidade disponível proporcional ao risco.

*Done when:* existe um lote elegível sem colisões ou um bloqueio explícito impede novo trabalho.

**Step 3: Executar por contrato**

1. Invoque `sdd-executar-task` uma vez por task, na sessão atual ou no executor isolado escolhido.
2. Passe somente o caminho exato e restrições voláteis de coexistência; deixe o executor ler PRD, TechSpec e task diretamente.
3. Aguarde o lote e exija implementação, validações e um único `## Handoff` atualizado por task.

*Done when:* cada task retorna implementação verificável ou bloqueio reproduzível sem alterar `tasks.md` ou mover arquivos.

**Step 4: Revisar e retrabalhar**

1. Compare diff e handoff com PRD, TechSpec, task e padrões aplicáveis.
2. Revise contratos, erros, casos limite, testes e candidatas a ADR.
3. Execute a menor validação automatizada capaz de refutar a conclusão e as verificações proporcionais ao risco.
4. Devolva achados objetivos ao mesmo executor e repita somente a task defeituosa.
5. Encaminhe para decisão humana ambiguidades, mudanças arquiteturais, conflitos entre fontes, dependências externas e aprovações ausentes.

*Done when:* cada task do lote está aprovada por revisão do orquestrador ou vinculada a uma decisão humana específica.

**Step 5: Persistir a conclusão**

1. Crie `done/` quando necessário e mova somente tasks aprovadas, preservando seus nomes.
2. Na mesma atualização, altere em `tasks.md` o link para `done/task_[num].md` e marque o estado como concluído.
3. Atualize `## Problemas e soluções` com task, evidência, impacto, solução e estado; omita dados sensíveis e timestamps desnecessários.
4. Confirme que todos os links do manifesto resolvem após o movimento.
5. Recalcule o DAG e retorne ao Step 2 enquanto houver trabalho elegível.

*Done when:* arquivo, link e estado de cada task aprovada mudaram juntos, o manifesto não possui links quebrados e o próximo lote foi determinado.

**Step 6: Encerrar a feature**

1. Confirme que não existem `task_*.md` pendentes na raiz e que todo o manifesto está completo.
2. Confirme critérios de aceite, testes, problemas, soluções e handoffs de todas as tasks.
3. Execute a validação final proporcional ao escopo.

*Done when:* toda task está em `done/`, toda evidência exigida está registrada e a validação final termina com sucesso.

## Reference — budget de execução

- `economico` ou ausente: use a opção disponível de menor custo que satisfaça o domínio e o risco.
- `medio`: aumente raciocínio ou capacidade para contratos compartilhados, concorrência, persistência ou integração.
- `alto`: use a maior capacidade disponível somente para risco arquitetural, financeiro, de segurança ou irreversível.

## Error Handling

- Se zero ou mais de uma feature corresponder, solicite o slug.
- Se manifesto e arquivos divergirem, preserve ambos e bloqueie a execução até reconciliar o estado.
- Se uma task bloquear, registre evidência, alternativas e decisão em `## Problemas e soluções`; mantenha-a pendente.
- Se um lote paralelo revelar colisão, interrompa somente as tasks ainda não iniciadas e retome sequencialmente.
