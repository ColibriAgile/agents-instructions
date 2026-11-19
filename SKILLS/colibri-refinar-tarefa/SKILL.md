---
name: colibri-refinar-tarefa
description: 'Refinamento de um chamado do Jira da Colibri no campo Refinement: contexto, user story, critérios de aceite numerados, notas técnicas e story points, na estrutura do tipo do chamado. Use quando pedirem para refinar um chamado ou preencher o campo Refinement, ou quando outra skill precisar do texto do refinamento. Não use para alterar a descrição ou outros campos do chamado.'
---

# Refinar chamado

A skill transforma as informações do chamado numa especificação para desenvolvimento, QA e produto. A especificação fica só no campo Refinement. A descrição e os outros campos do chamado ficam como estão.

## Constantes

| Item | Valor |
|---|---|
| Site Atlassian | `colibri.atlassian.net` (o `cloudId` aceita o hostname) |
| Campo Refinement | `customfield_10545`. O campo é texto (string), não ADF. |

Se o `editJiraIssue` recusa o id do campo, leia um chamado com Refinement preenchido com `getJiraIssue` e `expand: "names"`. O mapa `names` liga cada `customfield_*` ao nome dele.

## Modos

- **Gravação:** o usuário pediu o refinamento de um chamado. A skill faz os passos 1 a 6.
- **Proposta:** outra skill pediu o texto. A skill faz os passos 1 a 3 e devolve o texto. A skill que pediu o texto faz a aprovação e a gravação.

## Passo 1: Ler o chamado

1. Leia o chamado com `getJiraIssue`, `fields` com `summary`, `description`, `issuetype`, `priority`, `labels`, `components`, `issuelinks`, `status` e o campo Refinement.
2. Leia todos os comentários com `listJiraIssueComments`, por página, até `isLast`.
3. Leia com `getJiraIssue` cada chamado dos `issuelinks` e cada chamado que a descrição ou os comentários citam. Um fato de outro chamado entra no refinamento só depois desta leitura.
4. Anote, a partir dessas fontes: o problema ou a oportunidade, o comportamento esperado, o impacto para os usuários, as dependências, os riscos e as dúvidas abertas.

*Pronto quando:* o título, a descrição, todos os comentários, os metadados, o Refinement atual e cada chamado citado foram lidos.

## Passo 2: Escolher a estrutura

1. Escolha o tipo pelo `issuetype`. Use o título, a descrição e as labels só quando o `issuetype` não está na tabela de estruturas.
2. Tipo fora da tabela: `Emergency` usa a estrutura de `Bug`. Outro tipo usa a estrutura-base.

*Pronto quando:* o chamado tem exatamente 1 estrutura.

## Passo 3: Escrever o refinamento

1. Escreva as seções na ordem da estrutura, com as regras de texto abaixo.
2. Se o Refinement atual tem conteúdo, mantenha cada informação que ainda vale. Guarde para o relatório cada informação que o texto novo tira, com o motivo.
3. Resolva os conflitos entre fontes: vale a informação mais recente e, depois, a mais específica. Escreva cada divergência nas Notas Técnicas.

*Pronto quando:* cada seção da estrutura tem conteúdo, e cada requisito tem uma fonte lida no passo 1.

No modo proposta, a skill para aqui e devolve o texto.

## Passo 4: Aprovar

Mostre o texto ao usuário e **pergunte** se a skill grava. Se o pedido do usuário já mandava gravar ("refina e grava o WIN-123"), vá ao passo 5 sem perguntar. Se o usuário pede mudanças, aplique e mostre de novo.

*Pronto quando:* o usuário aprovou o texto, ou recusou a gravação. Com a recusa, vá ao passo 6.

## Passo 5: Gravar e conferir

1. Grave com `editJiraIssue` e `fields: {"customfield_10545": "<texto>"}`. O payload tem só esse campo.
2. Leia o campo de novo com `getJiraIssue` e `fields: ["customfield_10545"]`. Compare com o texto gravado: o título na primeira linha e os Critérios de Aceite como lista numerada.
3. Se a leitura mostra outro texto, reporte a gravação como falha.

*Pronto quando:* a leitura mostra o texto gravado, ou a falha está no relatório.

## Passo 6: Relatório

Informe: a estrutura usada, se a skill gravou o campo, as informações do Refinement antigo que saíram e o motivo, e as hipóteses e dúvidas do texto.

*Pronto quando:* o relatório tem os 4 itens.

## Regras de texto

- A primeira linha é o título do chamado.
- Cada seção tem um cabeçalho `##`, com o conteúdo abaixo dele. Uma seção sem conteúdo sai do texto.
- Os Critérios de Aceite são uma lista numerada, sempre.
- O texto usa markdown: o campo mostra listas, negrito e código.
- Uma hipótese ou uma dúvida fica escrita como **Hipótese:** ou **Dúvida:**, nunca como requisito.
- A Sugestão de Story Points é um número com a justificativa, por exemplo `5 Points (integração com backend e tratamento de concorrência)`. O número é uma sugestão, não a estimativa final.

## Estruturas

| Tipo | Seções, nesta ordem |
|---|---|
| Estrutura-base | Contexto; User Story; Critérios de Aceite; Notas Técnicas |
| Bug | Contexto; User Story; Como reproduzir; Comportamento Atual; Comportamento Esperado; Critérios de Aceite; Notas Técnicas; Sugestão de Story Points |
| QA Defect | Contexto; User Story; Como reproduzir; Evidências de QA; Comportamento Atual; Comportamento Esperado; Critérios de Aceite; Notas Técnicas; Sugestão de Story Points |
| Internal Defect | Contexto; User Story; Como reproduzir; Impacto Operacional; Comportamento Atual; Comportamento Esperado; Critérios de Aceite; Notas Técnicas; Sugestão de Story Points |
| Feature | Contexto; User Story; Escopo Funcional; Critérios de Aceite; Notas Técnicas; Sugestão de Story Points |
| Improvement | Contexto; User Story; Situação Atual; Melhoria Proposta; Critérios de Aceite; Notas Técnicas; Sugestão de Story Points |
| Spike | Contexto; Objetivo da Investigação; Perguntas a Responder; Critérios de Saída; Entregáveis Esperados; Notas Técnicas; Sugestão de Story Points |
| UI/UX | Contexto; Problema de Experiência; Solução Proposta; Critérios de Aceite; Referências de UX/UI; Notas Técnicas; Sugestão de Story Points |
| Deficit | Contexto; Gap Identificado; Escopo da Correção; Critérios de Aceite; Notas Técnicas; Sugestão de Story Points |
| Technical | Contexto; Objetivo Técnico; Escopo Técnico; Critérios de Aceite; Notas Técnicas; Sugestão de Story Points |
| Doc | Contexto; Objetivo da Documentação; Escopo da Documentação; Critérios de Aceite; Referências e Fontes; Sugestão de Story Points |

Exemplo de refinamento bem formado: o campo Refinement do `WIN-3355`.
