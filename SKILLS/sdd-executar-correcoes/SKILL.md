---
name: sdd-executar-correcoes
description: Executa tasks de correção de um code review sem criar ou reclassificar achados.
argument-hint: --prd nome-da-feature --num numero-da-revisao
disable-model-invocation: true
---

# Executar correções SDD

Implemente as tasks de uma única pasta `codereview_[num]`. Use `codereview.md → task atual` como prefixo e repita somente a unidade que falhar.

## Steps — execução

**Step 1: Fixar a revisão e o inventário**

1. Resolva `--prd` e `--num` pelo argumento ou contexto. Pesquise `tasks/prd-*/codereview_*/` somente para o valor ainda ausente.
2. Considere candidatas com `codereview.md` e pelo menos um `task_[num].md` pendente na raiz. Use a candidata única; se houver várias, apresente `<feature> / codereview_[num]` e aguarde escolha; se não houver nenhuma, pare.
3. Leia `codereview.md` integralmente uma vez. Depois, extraia de cada task apenas ID, resultado, dependências, limites e arquivos afetados.
4. Confirme que cada task aponta para ao menos um `CR-NN`, possui aceite e verificação e não duplica uma task em `done/`.

*Done when:* uma única revisão está fixa, cada task pendente pertence a um achado e o inventário contém somente metadados necessários para ordenar o trabalho.

**Step 2: Formar o próximo lote**

1. Monte o DAG usando as dependências declaradas nas tasks; trate dependência ausente ou circular como falha do plano, sem inferir outro contrato.
2. Selecione somente tasks elegíveis. Use execução sequencial como baseline.
3. Forme lote paralelo apenas quando houver duas ou mais tasks independentes sem colisão de arquivos, contratos, configuração ou ambiente de teste.
*Done when:* existe um lote elegível sem colisões ou cada bloqueio está ligado à task e à decisão que falta.

**Step 3: Implementar uma task por contexto**

1. Para execução sequencial, trabalhe na sessão atual. Para lote paralelo, use um executor isolado por task.
2. Em cada contexto, carregue integralmente e nesta ordem `codereview.md` e a task atual; carregue código, diffs e resultados de ferramentas somente depois.
3. Rastreie callers, contratos e testes até a causa do achado. Implemente a menor correção que satisfaça limites, requisitos e aceite.
4. Execute as verificações da task e a menor validação adicional capaz de refutar a correção.
5. Marque subtarefas somente com evidência e atualize o único `## Handoff` com resultado, arquivos, comandos e pendências.

*Done when:* cada task do lote possui implementação e handoff verificáveis ou um bloqueio reproduzível, sem mudança fora do escopo.

**Step 4: Revisar e retrabalhar localmente**

1. Compare cada diff e handoff com o achado, os requisitos e os critérios da task.
2. Revise regressões em contratos, erros, casos limite, segurança, concorrência, persistência e performance conforme o domínio.
3. Reexecute a menor validação refutadora e os testes obrigatórios.
4. Em falha, devolva somente a mesma task ao mesmo contexto com achados objetivos; repita até aprovação ou bloqueio.

*Done when:* cada task está aprovada por diff e testes ou permanece pendente com evidência e decisão necessária.

**Step 5: Persistir a conclusão**

1. Crie `done/` quando necessário e mova somente tasks aprovadas, preservando nomes.
2. Preserve `codereview.md`; o histórico do achado é imutável.
3. Recalcule o DAG pelos arquivos restantes e volte ao Step 2.

*Done when:* toda task aprovada está em `done/`, nenhuma pendente foi movida e o próximo lote foi determinado.

**Step 6: Validar o conjunto**

1. Quando a raiz não contiver tasks, execute a validação proporcional ao conjunto de correções.
2. Confirme que cada `CR-NN` acionável do relatório possui uma task concluída e evidência.
3. Invoque `sdd-revisar-codigo` para gerar uma nova revisão imutável. Compare achados originais e novos sem misturá-los.
4. Trate achado original ainda presente como correção incompleta; trate achado novo como novo trabalho.

*Done when:* todas as tasks estão em `done/`, testes finais passaram e uma nova revisão confirma os achados originais como corrigidos ou registra bloqueios específicos.

## Error Handling

- Se relatório ou task estiver ausente, vazio ou ilegível, preserve os arquivos e informe o caminho exato.
- Se uma task exigir arquitetura nova, contradizer a TechSpec ou sair dos limites, aguarde decisão humana antes de editar.
- Se o ambiente impedir validação, mantenha a task na raiz e registre comando, erro e impacto no handoff.
- Se um executor paralelo produzir colisão, interrompa as tasks ainda não iniciadas e retome sequencialmente.
