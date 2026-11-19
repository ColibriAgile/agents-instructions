---
name: colibri-campos-release
description: 'Campos de release de um chamado do Jira da Colibri: escreve o Release title e as Release notes para o usuário final, sem jargão técnico. Use quando pedirem para preencher, revisar ou gerar os campos de release de um chamado, ou quando outra skill precisar desse texto. Não use para montar as notas de release de uma versão (use colibri-notas-release).'
---

# Campos de release

A skill escreve os campos Release title e Release notes de 1 chamado. O texto diz ao usuário final o que mudou e qual é o benefício. A skill `colibri-notas-release` lê estes campos depois, para montar as notas da versão.

## Constantes

- Os IDs dos campos Release title e Release notes ficam só na tabela Constantes da skill `colibri-notas-release`, do mesmo bundle: `../colibri-notas-release/SKILL.md`. Antes do passo 1, leia essa tabela.
- Os 2 campos são texto (string), não ADF.
- O site Atlassian é `colibri.atlassian.net` (o `cloudId` aceita o hostname).

Se o `editJiraIssue` recusa um id de campo, leia um chamado com os campos preenchidos com `getJiraIssue` e `expand: "names"`. O mapa `names` liga cada `customfield_*` ao nome dele.

## Modos

- **Gravação:** o usuário pediu os campos de um chamado. A skill faz os passos 1 a 6.
- **Proposta:** outra skill pediu o texto. A skill faz os passos 1 a 3 e devolve o texto. A skill que pediu o texto faz a aprovação e a gravação.

## Passo 1: Ler o chamado

1. Leia o chamado com `getJiraIssue`, `fields` com `summary`, `description`, `issuetype`, `labels`, `components`, `issuelinks`, `status`, os 2 campos de release e o campo Refinement. O ID do Refinement fica na tabela Constantes de `../colibri-refinar-tarefa/SKILL.md`.
2. Leia todos os comentários com `listJiraIssueComments`, por página, até `isLast`.
3. Leia com `getJiraIssue` cada chamado dos `issuelinks` e cada chamado que a descrição ou os comentários citam.
4. No modo proposta, use também o resumo das mudanças que a skill que pediu o texto enviou.

*Pronto quando:* o título, a descrição, os critérios de aceite, todos os comentários, os valores atuais dos 2 campos e cada chamado citado foram lidos.

## Passo 2: Achar o benefício

1. Separe o que o usuário final percebe do que é detalhe interno. Use a informação mais recente quando as fontes divergem.
2. Junte as mudanças do mesmo assunto numa só mensagem.
3. Escreva o benefício numa frase. Se as fontes não mostram um efeito para o usuário, diga ao usuário (ou à skill que pediu o texto) qual informação falta e pare. A skill grava só um texto com benefício real.

*Pronto quando:* o benefício para o usuário final está numa frase, ou a falta de informação está informada.

## Passo 3: Escrever os 2 campos

Escreva o Release title e as Release notes com as regras de texto abaixo. Escreva os 2 campos sempre juntos: um título novo com notas antigas deixa o chamado incoerente.

*Pronto quando:* os 2 textos seguem cada regra de texto.

No modo proposta, a skill para aqui e devolve os 2 textos.

## Passo 4: Aprovar

Mostre os 2 textos ao usuário e **pergunte** se a skill grava. Se o pedido do usuário já mandava gravar ("preenche o release do WIN-123"), vá ao passo 5 sem perguntar. Se o usuário pede mudanças, aplique e mostre de novo.

*Pronto quando:* o usuário aprovou os textos, ou recusou a gravação. Com a recusa, vá ao passo 6.

## Passo 5: Gravar e conferir

1. Grave com 1 chamada `editJiraIssue`, com os 2 campos em `fields`. O payload tem só esses 2 campos.
2. Leia os 2 campos de novo com `getJiraIssue` e compare com os textos gravados.
3. Se a leitura mostra outro texto, reporte a gravação como falha.

*Pronto quando:* a leitura mostra os 2 textos gravados, ou a falha está no relatório.

## Passo 6: Relatório

Informe: os 2 textos, se a skill gravou os campos e os valores antigos que os textos novos substituíram.

*Pronto quando:* o relatório tem os 3 itens.

## Regras de texto

### Release title

- 1 frase curta, sem ponto final.
- Resume o principal benefício para o usuário.
- Sem termo técnico e sem nome interno de projeto, módulo ou componente.
- Exemplos: `Melhorias na consulta de pedidos`, `Correção na atualização de cadastro`, `Novo acompanhamento de status de vendas`.

### Release notes

- 1 parágrafo, sem lista e sem tópicos.
- Explica o que mudou do ponto de vista do usuário final e qual é o benefício.
- Começa com uma forma destas: "Agora é possível…", "Melhorada a experiência de…", "Corrigido um problema que…", "O sistema passou a…", "A navegação foi simplificada…", "Implementado endpoint…".
- Exemplos:
  - `Corrigido um problema que poderia impedir a atualização de informações cadastrais em situações específicas, garantindo maior estabilidade e confiabilidade no processo.`
  - `Agora é possível acompanhar o status dos pedidos diretamente na tela principal, facilitando o controle e o acompanhamento das operações.`

### Linguagem dos 2 campos

- Português do Brasil, claro e profissional, para usuários finais e áreas de negócio.
- Uma sigla interna tem a explicação junto.
- O texto fala só do efeito visível. A implementação fica fora: classes, métodos, frameworks, bibliotecas, refatorações, ajustes internos e a estrutura interna do sistema.
- Exceção, só nas Release notes: o texto cita o contrato público que muda para quem integra ou administra o sistema. São os nomes de APIs e endpoints, e as tabelas, colunas, procedures, views e functions criadas ou alteradas.

Exemplo de campos bem preenchidos: o `WIN-3355`.
