---
name: jira-task-refinement
description: 'Refina tarefas do Jira obrigatoriamente usando Jira MCP na instância fixa https://colibri.atlassian.net/. Use quando pedir para refinar issue, detalhar tarefa, enriquecer descrição de refinamento, ou usar prompts como "refinar a tarefa COL-1234", montando contexto, user story, critérios de aceite, notas técnicas e sugestão de story points, lendo título, descrição e comentários e atualizando apenas o campo personalizado Refinement sem alterar a descrição original. Não tente executar esse fluxo por browser, scraping ou outra integração fora do Jira MCP. Se o workspace atual corresponder à tarefa, pode sugerir analisar o código disponível para melhorar o refinamento técnico.'
argument-hint: 'Ex.: refinar a tarefa COL-1234'
---

# Jira Task Refinement

## Quando usar

Use este skill quando o usuário pedir para:

- refinar uma tarefa do Jira;
- usar prompts no formato `refinar a tarefa COL-1234`;
- detalhar uma issue antes do desenvolvimento;
- transformar título, descrição e comentários em uma especificação mais clara;
- preencher ou atualizar o campo personalizado `Refinement`;
- sugerir critérios de aceite, notas técnicas ou story points com base no contexto da issue.

## Objetivo

Ler os dados atuais da issue obrigatoriamente via Jira MCP, usando como padrão a instância fixa `https://colibri.atlassian.net/`, sintetizar o contexto funcional e técnico, produzir um refinamento estruturado em Markdown e atualizar somente o campo personalizado `Refinement`.

A descrição original da issue deve ser preservada. Nunca substituir, reescrever ou apagar o conteúdo do campo `description` como parte deste fluxo, salvo instrução explícita do usuário.

Este skill não deve tentar obter ou atualizar dados do Jira por browser, scraping, consulta manual, fetch genérico de páginas ou qualquer outro meio fora do Jira MCP.

Quando o workspace atual estiver claramente relacionado à tarefa refinada, o skill pode sugerir ao usuário a análise do código disponível para enriquecer principalmente as `Notas Técnicas`, os riscos, as dependências e os critérios de aceite técnicos.

## Uso obrigatório do Jira MCP

Para este skill, o Jira MCP é mandatório do início ao fim.

- Use Jira MCP para localizar a issue.
- Use Jira MCP para ler título, descrição, comentários e metadados.
- Use Jira MCP para descobrir o campo personalizado `Refinement`.
- Use Jira MCP para atualizar o campo `Refinement`.
- Não tente executar nenhuma dessas etapas por outro canal.
- Use PUT para atualizar o campo `Refinement`, não PATCH, para evitar efeitos colaterais indesejados.
- O campo `Refinement` é customfield_10545 (cf[10545]).

## Comportamento em caso de falha do Jira MCP

Se o Jira MCP falhar em qualquer etapa, o fluxo deve parar imediatamente.

- Não tente browser, scraping, fetch web, automação visual, API paralela ou entrada manual como alternativa.
- Não invente dados ausentes com base em contexto parcial.
- Informe ao usuário qual etapa falhou, por exemplo: localizar a issue, ler comentários, descobrir o campo `Refinement` ou atualizar o campo.
- Quando possível, inclua a mensagem de erro retornada pelo Jira MCP de forma resumida.
- Oriente o usuário a corrigir o acesso, a conectividade ou o mapeamento necessário antes de tentar novamente.

## Análise opcional do código do workspace

Se o workspace aberto aparentar ser o repositório ou módulo relacionado à issue, o skill pode sugerir uma análise complementar do código local para melhorar o refinamento.

- Essa análise é opcional e complementar.
- Os dados da issue continuam vindo obrigatoriamente do Jira MCP.
- A análise do código serve para enriquecer entendimento técnico, impacto, dependências, pontos de integração, riscos e critérios de aceite técnicos.
- Se não houver evidência suficiente de que o workspace corresponde à tarefa, não assuma relação automaticamente.
- Em caso de dúvida, sugira a análise como opção ao usuário em vez de tratá-la como premissa.

## Entradas esperadas

Preferencialmente receba um destes formatos:

- pedido em linguagem natural no formato `refinar a tarefa COL-1234`;
- chave da issue, como `COL-1234`;
- link da issue no Jira;
- pedido textual contendo a chave da issue e alguma orientação adicional.

Se o pedido não trouxer uma issue identificável, solicite a chave ou o link antes de continuar.

## Procedimento

1. Identifique a issue alvo.
   - Priorize prompts no formato `refinar a tarefa COL-1234` quando a chave vier embutida no texto.
   - Considere `https://colibri.atlassian.net/` como instância padrão, salvo instrução explícita em contrário.
   - Faça esta identificação via Jira MCP.
2. Resolva o campo de destino do refinamento:
   - confirme se `Refinement` é o nome exato do campo personalizado;
   - quando necessário, consulte a lista de campos disponíveis no Jira MCP para localizar o id interno correto;
   - se houver ambiguidade entre label, nome amigável e custom field, não atualize no escuro.
3. Busque no Jira, via Jira MCP, pelo menos:
   - título;
   - descrição atual;
   - comentários relevantes;
   - tipo da issue, prioridade, labels e outros metadados úteis, quando disponíveis.
4. Analise o material coletado e separe:
   - problema ou oportunidade de negócio;
   - comportamento esperado pelo usuário;
   - restrições, dependências e riscos técnicos;
   - dúvidas ou lacunas de informação.
5. Se o workspace atual parecer corresponder à tarefa, considere sugerir análise do código local para enriquecer o refinamento técnico.
   - Use essa análise apenas como complemento ao que foi obtido no Jira MCP.
   - Priorize identificar arquivos, fluxos, integrações, entidades e pontos de impacto relevantes.
   - Se a análise do código trouxer hipóteses, registre-as como hipótese e não como fato confirmado da issue.
6. Elabore o conteúdo do campo `Refinement` seguindo exatamente a estrutura definida na seção **Formato obrigatório do refinamento**.
7. Quando houver lacunas relevantes, faça suposições mínimas, explícitas e conservadoras. Não invente regras de negócio específicas sem indício na issue.
8. Atualize somente o campo personalizado `Refinement` no Jira.
9. Informe ao usuário:
   - que a descrição original não foi alterada;
   - qual issue foi refinada;
   - um resumo curto dos principais pontos adicionados;
   - qualquer dúvida pendente que ainda mereça validação humana.

Se qualquer chamada ao Jira MCP falhar antes da etapa 7, interrompa o fluxo e reporte a falha ao usuário sem tentar caminhos alternativos.

## Formato obrigatório do refinamento

O valor do campo `Refinement` deve seguir estas regras:

- Usar ADF (Atlassian Document Format) para formatação.
- Cada seção deve usar cabeçalho H2.
- O título da issue deve ficar em uma linha própria, fora dos cabeçalhos de seção.
- O conteúdo de cada seção deve começar na linha seguinte ao cabeçalho.
- Use texto normal abaixo de cada H2; nunca coloque o conteúdo na mesma linha do título da seção.
- Salvo instrução explícita em contrário, use esta ordem de seções:
  1. `## Contexto`
  2. `## User Story`
  3. `## Critérios de Aceite`
  4. `## Notas Técnicas`
  5. `## Sugestão de Story Points`

## Modelo de saída

Use o formato abaixo como referência estrutural:

`<Título da issue>`

`## Contexto`
`Texto corrido explicando problema, motivação, impacto e origem da demanda.`

`## User Story`
`Como <perfil>, quero <objetivo>, para <benefício>.`

`## Critérios de Aceite`
`Liste critérios objetivos, verificáveis e preferencialmente independentes.`

`## Notas Técnicas`
`Descreva integrações, dependências, riscos, decisões técnicas, pontos em aberto e observações para implementação.`

`## Sugestão de Story Points`
`Sugira a pontuação com uma justificativa curta baseada em complexidade, risco e esforço.`

## Regras de qualidade

Antes de atualizar a issue, valide se o refinamento:

- está aderente ao título, descrição e comentários existentes;
- não contradiz informações explícitas da issue;
- não altera a descrição original;
- separa claramente contexto funcional de notas técnicas;
- traz critérios de aceite testáveis e específicos;
- registra incertezas como dúvidas ou hipóteses, sem mascará-las como fato;
- quando houver análise de código local, separa claramente evidência observada no código de inferências ainda não confirmadas;
- apresenta sugestão de story points com justificativa sucinta.

## Decisões e ramificações

### Quando faltarem dados

Se a issue estiver pobre em contexto:

- monte um refinamento mínimo com base no que existir;
- sinalize claramente as lacunas;
- peça complemento ao usuário somente se a ausência impedir um refinamento minimamente confiável.

### Quando houver comentários conflitantes

Se comentários e descrição divergirem:

- priorize a informação mais recente e mais específica;
- mencione a divergência nas `Notas Técnicas` ou no resumo ao usuário;
- evite consolidar como fato algo que permaneça ambíguo.

### Quando a issue já tiver refinamento

Se o campo `Refinement` já estiver preenchido:

- leia o conteúdo atual antes de sobrescrever;
- preserve informações úteis e atualize a estrutura sem perder contexto relevante;
- evite duplicação literal;
- se a mudança for substancial e arriscada, apresente um resumo do que será alterado antes de gravar.

### Quando o campo `Refinement` não estiver mapeado claramente

Se o Jira expuser mais de um campo parecido ou se `Refinement` não aparecer com esse nome exato:

- tente localizar o custom field correto por nome, contexto e id;
- não atualize labels comuns achando que são o campo de refinamento;
- se a identificação continuar ambígua, peça confirmação ao usuário antes de gravar.

### Quando o Jira MCP falhar

Se houver erro de autenticação, permissão, conectividade, endpoint, mapeamento de campo ou qualquer outra falha no Jira MCP:

- interrompa o fluxo imediatamente;
- não tente coletar dados por nenhum outro meio;
- reporte ao usuário o ponto exato da falha;
- solicite correção do problema antes de prosseguir.

### Quando houver código relevante no workspace

Se o workspace atual aparentar corresponder à tarefa:

- você pode sugerir a análise do código disponível para aprofundar o refinamento;
- use o código para enriquecer notas técnicas, riscos, impacto, dependências e critérios técnicos;
- não use análise local para substituir a leitura oficial da issue no Jira MCP;
- deixe claro ao usuário quando um ponto vier de observação do código e não de informação explícita da issue.

## Restrições

- Usar obrigatoriamente Jira MCP para leitura e escrita da issue.
- Não tentar usar browser, scraping, fetch web, automação visual ou outra integração fora do Jira MCP.
- Se o Jira MCP falhar, parar imediatamente e informar o erro ao usuário, sem fallback.
- Não usar análise de código local como substituto dos dados oficiais da issue no Jira.
- Não alterar o campo `description`, salvo ordem explícita do usuário.
- Não apagar contexto útil já presente no `Refinement` existente sem motivo claro.
- Não inventar critérios de aceite altamente específicos sem base em evidências.
- Não estimar story points como verdade absoluta; trate como sugestão.

## Resposta ao usuário

Ao final, responda com:

- issue refinada;
- confirmação de que apenas o campo `Refinement` foi atualizado;
- resumo de 3 a 5 bullets com o que entrou no refinamento;
- dúvidas ou riscos pendentes, se houver.
