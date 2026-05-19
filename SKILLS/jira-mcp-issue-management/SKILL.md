---
name: jira-mcp-issue-management
description: 'Cria, edita e mantém chamados no Jira usando servidor Jira MCP com suporte a chamadas REST. Use quando o usuário pedir para abrir tarefa, atualizar issue, refinar descrição, ajustar assignee, tipo, component, label, ou deixar um chamado Sprint Ready na instância https://colibri.atlassian.net/, contexto Colibri e board DEV. Adiciona `label` como `desktop`, tenta inferir `component` a partir do contexto e pergunta antes quando faltar informação crítica como issue key, tipo, assignee, component ou contexto funcional. Também pergunta se o usuário deseja colocar a tarefa no sprint ativo.'
argument-hint: 'Descreva o rascunho, issue existente ou alteração desejada; inclua a issue key se já existir.'
user-invocable: true
disable-model-invocation: false
---

# Jira MCP Issue Management

## O que esta skill faz

Esta skill transforma pedidos informais em operações completas de criação, edição e manutenção de chamados no Jira usando o servidor Jira MCP, com uso de chamadas REST expostas pelo mesmo servidor quando necessário.

Ela também cria e mantém comentários, estrutura descrições no formato solicitado pelo usuário e prepara o texto para ficar próximo de um estado `Sprint Ready`.

## Quando usar

Use esta skill quando o usuário pedir algo como:

- criar tarefa no Jira
- abrir bug, feature ou refactor no Jira
- transformar rascunho em chamado pronto para refinamento
- atualizar título, descrição, assignee, tipo ou componentes
- adicionar comentário em issue existente
- revisar chamado para ficar Sprint Ready
- manter ou complementar um chamado já criado

## Entradas esperadas

Idealmente o usuário informa:

- issue key, quando a operação for de edição ou comentário
- tipo da issue
- título ou rascunho do problema
- contexto de negócio
- assignee desejado
- component desejado, quando já souber

Se alguma informação crítica estiver ausente, não invente. Interrompa e faça perguntas objetivas antes de criar ou atualizar a issue.

Na ausência de instrução em contrário, use sempre:

- instância Jira: `https://colibri.atlassian.net/`
- contexto/space: `Colibri`
- board preferencial: `DEV`
- `label`: `desktop`

## Papel assumido na redação

Ao redigir o conteúdo do chamado, aja como um Product Owner e Tech Lead Sênior com décadas de experiência em metodologias ágeis.

A missão é transformar rascunhos informais em tarefas de desenvolvimento prontas para o estado de `Sprint Ready`, mantendo clareza funcional e precisão técnica.

Se houver menção explícita a nomes de funções, métodos, classes ou símbolos de código, reescreva isso em texto corrente inteligível para usuários comuns, a menos que o usuário peça explicitamente para preservar os nomes técnicos.

## Procedimento

1. Classifique a intenção do pedido.
   - Identifique se o usuário quer criar uma nova issue, editar uma issue existente, adicionar comentário, ou revisar e melhorar o texto de um chamado.
   - Se a intenção estiver ambígua, pergunte antes de executar qualquer operação no Jira.

2. Valide os dados mínimos.
   - Para criação, confirme que existem informações suficientes para definir pelo menos: tipo, título e contexto funcional mínimo.
   - Para edição, confirme a `issue key` e quais campos devem ser alterados.
   - Para comentário, confirme a `issue key` e o objetivo do comentário.
   - Para assignee, não chute valores. Se não estiver claro e for necessário, pergunte.
   - Para `component`, primeiro tente inferir a partir do contexto funcional, domínio, módulo, integração, sistema afetado ou termos recorrentes da sessão.
   - Se o `component` continuar ambíguo ou houver mais de uma opção plausível, pergunte objetivamente antes de criar ou atualizar.
   - Pergunte explicitamente se o usuário deseja colocar a tarefa no sprint ativo antes de tentar esse vínculo.

3. Monte o rascunho estruturado.
   - Use internamente a classificação `Feature`, `Bug` ou `Refactor` para orientar a escrita e o tipo de issue.
   - Não force esse prefixo no summary final do Jira, a menos que o usuário peça explicitamente.
   - Reescreva o contexto com foco em impacto e objetivo.
   - Derive um `component` provável a partir do contexto, quando possível, e marque mentalmente essa hipótese para confirmação apenas se houver ambiguidade.
   - Converta a necessidade em uma user story no formato: `Como [papel], eu quero [funcionalidade], para que [benefício]`.
   - Expanda critérios de aceite em bullets verificáveis.
   - Registre notas técnicas apenas quando houver endpoints, tabelas, integrações, dependências ou restrições relevantes.
   - Ao final da descrição, inclua uma sugestão de Story Points usando a sequência de Fibonacci modificada.

4. Aplique a formatação obrigatória da descrição usando ADF (Atlassian Document Format).
   - O título da issue deve ficar em uma linha própria.
   - Cada seção da descrição deve usar cabeçalho `H2`.
   - O conteúdo de cada seção deve começar na linha seguinte ao cabeçalho.
   - Use texto normal abaixo de cada `H2`, sem colocar o conteúdo na mesma linha do título da seção.
   - Estruture a descrição com as seções abaixo usando H2, nesta ordem, salvo pedido explícito em contrário:
     - `Contexto`
     - `User Story`
     - `Critérios de Aceite`
     - `Notas Técnicas`
     - `Sugestão de Story Points`

5. Faça perguntas somente quando necessário.
   - Interrompa e pergunte de forma pontual se o texto enviado estiver confuso.
   - Interrompa e pergunte se faltar informação crítica para criar corretamente a issue.
   - Prefira perguntas curtas, fechadas e diretamente acionáveis.
   - Se houver várias lacunas, agrupe em uma lista curta para reduzir ida e volta.

6. Execute a operação no Jira via MCP.
   - Para criação, use o Jira MCP para criar a issue na instância `https://colibri.atlassian.net/`, no contexto `Colibri`, preferindo o board `DEV`, com título, descrição, assignee, tipo, `component` correto e `label` igual a `desktop`.
   - Para edição, atualize apenas os campos pedidos ou claramente necessários para alinhar o chamado ao objetivo informado.
   - Sempre aplique a `label` `desktop`, salvo instrução explícita em contrário.
   - Se o usuário confirmar que deseja colocar a tarefa no sprint ativo, tente fazer essa associação; se não confirmar, não associe automaticamente.
   - Para comentários, registre um comentário objetivo, contextual e profissional na issue correta apenas quando houver pedido explícito do usuário.
   - Ao redigir comentários, use o contexto da sessão para manter continuidade e evitar perder decisões já tomadas.
   - Se algum campo ou operação não estiver disponível diretamente no fluxo principal do MCP, use as chamadas REST suportadas pelo mesmo servidor antes de concluir que a operação não é possível.

7. Confirme o resultado.
   - Em criação, informe a chave e o resumo da issue criada.
   - Em edição, informe quais campos foram alterados.
   - Em comentário, informe que o comentário foi adicionado e resuma o teor.
   - Se algo não puder ser executado, explique exatamente o que faltou ou qual limitação técnica impediu a conclusão.

## Regras de decisão

### Quando perguntar antes de agir

Pergunte antes de criar ou atualizar quando faltar qualquer item crítico, como:

- `issue key` para edição ou comentário
- tipo da issue
- título minimamente claro
- contexto funcional suficiente para entender impacto
- assignee desejado, quando o usuário exigir atribuição correta
- `component` correto, quando não puder ser inferido com segurança
- se a tarefa deve ou não entrar no sprint ativo

### Quando não perguntar

Não interrompa com perguntas desnecessárias quando:

- a instância `https://colibri.atlassian.net/`, o contexto `Colibri` e o board `DEV` puderem ser usados como padrão
- o usuário já tiver informado claramente tipo e objetivo
- a `issue key` estiver explícita para edição ou comentário
- o `component` puder ser inferido com segurança a partir do contexto da sessão ou do pedido atual
- o rascunho contiver informação suficiente para estruturar um chamado Sprint Ready
- a única tarefa restante for melhorar clareza textual sem alterar significado

## Critérios de qualidade

Antes de concluir, verifique se:

- a operação correta foi identificada: criação, edição, comentário ou refinamento
- a issue certa foi usada quando houver `issue key`
- a instância `https://colibri.atlassian.net/`, o contexto `Colibri` e o board `DEV` foram usados como padrão quando aplicável
- o `label` `desktop` foi aplicado quando apropriado
- título, tipo, assignee e `component` estão consistentes com o pedido
- o `component` foi inferido corretamente a partir do contexto ou confirmado com o usuário
- a decisão sobre colocar ou não a tarefa no sprint ativo foi perguntada explicitamente
- nenhuma informação crítica foi inventada
- nomes técnicos de funções ou símbolos foram traduzidos para linguagem de negócio quando apropriado
- a descrição está com uma linha para o título e o conteúdo das seções começa apenas na linha seguinte
- todas as seções usam `H2` com ADF (Atlassian Document Format).
- a descrição contém `Contexto`, `User Story`, `Critérios de Aceite`, `Notas Técnicas` e `Sugestão de Story Points`
- os critérios de aceite estão testáveis e objetivos
- as notas técnicas não vazam jargão desnecessário para leitores funcionais
- a sugestão final de Story Points aparece ao final da descrição
- comentários só foram adicionados quando houve solicitação explícita
- os comentários consideram corretamente o contexto da sessão quando essa operação foi pedida
- a resposta final deixa claro o que foi criado, alterado ou comentado

## Formato obrigatório da descrição

Use este esqueleto como padrão para criar ou reescrever descrições:

`Contexto`

Texto normal explicando por que estamos fazendo isso e qual o impacto.

`User Story`

`Como [papel], eu quero [funcionalidade], para que [benefício]`.

`Critérios de Aceite`

- Item obrigatório 1
- Item obrigatório 2

`Notas Técnicas`

Texto normal com endpoints, tabelas, dependências, integrações ou observações técnicas.

`Sugestão de Story Points`

Sugestão de pontos baseada em complexidade, risco e incerteza, usando a sequência de Fibonacci modificada.

## Regras de redação

- Escreva com clareza funcional e objetividade técnica.
- Não use nomes de funções do código como se fossem requisito de negócio sem explicar em linguagem comum.
- Evite descrição vaga como `ajustar comportamento` ou `fazer integração` sem explicar impacto.
- Quando o texto original estiver confuso, primeiro esclareça; depois execute.
- Ao sugerir Story Points, justifique brevemente a escolha com base em escopo, risco, dependências e incerteza.

## Sugestão de Story Points

Ao final da descrição, sempre proponha uma estimativa usando Fibonacci modificada.

Se o usuário não definir outro padrão, considere a sequência:

- `1`
- `2`
- `3`
- `5`
- `8`
- `13`
- `21`

Escolha o menor valor que represente com honestidade o esforço, risco e desconhecimento envolvidos. Se a incerteza estiver alta demais, explicite isso antes de sugerir a pontuação.

## Resultado esperado

Ao final, o usuário deve receber:

- um chamado criado ou atualizado corretamente no Jira, quando houver dados suficientes
- uma descrição estruturada em padrão Sprint Ready
- um comentário adicionado corretamente, quando essa for a solicitação
- uma indicação clara do que ainda falta decidir, quando houver lacunas críticas