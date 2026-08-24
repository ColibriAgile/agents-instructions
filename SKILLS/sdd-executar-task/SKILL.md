---
name: sdd-executar-task
description: "Executa uma task SDD exata, diretamente ou por sdd-orquestrar-tasks; não planeja, aprova nem publica ADRs."
argument-hint: --task tasks/prd-nome/task_01.md
---

# Executar uma task SDD

Implemente e valide exatamente uma task. Entregue evidências para que o chamador faça uma revisão independente e decida sua conclusão.

## Steps — execução

**Step 1: Fixar a task e o contexto**

1. Resolva `--task` para um único arquivo `tasks/prd-<slug>/task_<num>.md`.
2. Exija `prd.md`, `techspec.md` e `tasks.md` na mesma pasta da feature.
3. Leia integralmente, nesta ordem: `prd.md`, `techspec.md` e a task. Leia `tasks.md` e estado mutável somente depois desse prefixo.
4. Confirme no manifesto que a task está pendente e que todas as dependências estão concluídas. Trate uma task em `done/` como já concluída e apenas reporte seu estado.

*Done when:* uma única task pendente está identificada, suas fontes foram carregadas na ordem fixa e todas as dependências estão concluídas.

**Step 2: Delimitar a mudança**

1. Leia as instruções do repositório e carregue integralmente as skills aplicáveis indicadas pela task.
2. Inspecione o estado atual do worktree e preserve alterações preexistentes fora do escopo.
3. Rastreie o caminho de execução, contratos, callers e testes afetados até localizar o menor ponto correto para implementar cada obrigação.
4. Mapeie cada subtarefa e critério de aceite para uma mudança e uma verificação observável.

*Done when:* toda obrigação da task possui um ponto de implementação e uma verificação, sem conflito não resolvido com PRD, TechSpec ou mudanças preexistentes.

**Step 3: Implementar a task**

1. Implemente a menor mudança coerente que satisfaça a task e mantenha seus limites explícitos.
2. Adicione ou ajuste os testes que comprovam o comportamento introduzido.
3. Marque cada subtarefa no arquivo da task somente depois de produzir sua evidência.
4. Restrinja o estado global ao chamador: altere a própria task, mas deixe `tasks.md` e `done/` intactos.

*Done when:* todas as subtarefas implementáveis estão marcadas com evidência e nenhuma mutação de estado global foi realizada.

**Step 4: Validar o resultado**

1. Execute os comandos de verificação definidos na task.
2. Execute a menor validação adicional capaz de refutar a implementação quando o risco ou o caminho alterado exigir.
3. Revise o diff por escopo, contratos, erros, casos limite e alterações acidentais.
4. Diferencie falhas introduzidas pela task de falhas preexistentes ou indisponibilidades do ambiente.

*Done when:* cada critério de aceite possui evidência de sucesso ou um bloqueio reproduzível registrado, e o diff contém somente mudanças justificadas pela task.

**Step 5: Entregar o handoff e as candidatas a ADR**

1. Atualize o único `## Handoff` da task com resultado produzido, arquivos alterados, comandos, resultados e pendências. Em retry, edite a mesma seção e preserve evidências ainda válidas; nunca duplique o heading.
2. Registre uma candidata somente quando a decisão:
   - afetar fronteiras, dependências, contratos, persistência, segurança, operação ou atributo de qualidade relevante;
   - envolver alternativa plausível ou trade-off real;
   - tiver uma razão que não possa ser recuperada com segurança apenas do código e dos testes;
   - continuar governando mudanças depois da liberação da feature.
3. Identifique cada candidata como `TXX-ADR-NN` e registre título, contexto, decisão implementada, alternativas, consequências, evidências, componentes afetados e relação com a TechSpec. Registre `Nenhuma` quando as decisões apenas executarem a TechSpec ou forem detalhes locais.
4. Trate um desvio da TechSpec como bloqueio até existir aprovação humana; depois registre a aprovação em `Relação com TechSpec`.
5. Entregue as candidatas para uma etapa posterior de promoção; preserve a criação e o aceite do ADR para depois de implementação e QA.

*Done when:* existe exatamente um handoff que permite revisão independente, toda decisão arquitetural nova está representada por uma candidata completa ou por um bloqueio, e nenhuma ADR definitiva foi criada.

## Error Handling

- Se o caminho ou as fontes forem ambíguos ou ausentes, reporte exatamente o que falta e aguarde uma task identificável.
- Se uma dependência estiver pendente, reporte seu ID e devolva a task sem implementar.
- Se PRD, TechSpec e task entrarem em conflito, preserve as evidências, registre a decisão necessária no handoff e aguarde resolução humana.
- Se uma validação não puder ser executada, registre comando, erro e impacto; mantenha sem marcar as subtarefas cuja evidência depende dela.
