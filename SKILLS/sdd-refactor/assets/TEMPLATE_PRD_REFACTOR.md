# PRD: Refatoração de [Nome do módulo/Form]

- **Autor:**
- **Data:**
- **Status:** Rascunho / Aprovado

## Contexto

Por que refatorar agora? (dívida técnica bloqueando outra feature, dificuldade de manutenção, preparação para migração, etc.)

## Escopo

**Módulo/Form/Classe alvo:**

**O que muda estruturalmente** (visão de alto nível, sem detalhe de implementação — isso fica na techspec):

**Non-goals** (o que explicitamente NÃO está no escopo — evita que o refactor vire melhoria de feature disfarçada):

## Requisitos

> Em refactor, "requisito" não é comportamento novo — é comportamento existente que não pode mudar. Cada linha vira insumo para os test cases da techspec e, depois, para as tarefas geradas pela skill `sdd-tasks`.

| ID | Comportamento observável a preservar | Origem/evidência |
|---|---|---|
| R1 | Ex: Ao clicar em "Salvar" com campo X vazio, exibe validação Y | Código atual / roteiro manual |
| R2 | | |
| R3 | | |

## Critérios de aceite

- [ ] Todos os requisitos (R1, R2, ...) verificados após a refatoração
- [ ] Nenhuma regressão de comportamento fora do escopo declarado
- [ ] Suite de testes (existente + testes de caracterização novos) passando
- [ ] Roteiro de verificação manual (ver techspec) executado sem divergência
