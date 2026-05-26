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
6. Identifique o tipo da issue e elabore o conteúdo do campo `Refinement` seguindo exatamente a estrutura definida na seção **Formato obrigatório do refinamento por tipo**.
7. Quando houver lacunas relevantes, faça suposições mínimas, explícitas e conservadoras. Não invente regras de negócio específicas sem indício na issue.
8. Atualize somente o campo personalizado `Refinement` no Jira.
9. Informe ao usuário:
   - que a descrição original não foi alterada;
   - qual issue foi refinada;
   - um resumo curto dos principais pontos adicionados;
   - qualquer dúvida pendente que ainda mereça validação humana.

Se qualquer chamada ao Jira MCP falhar antes da etapa 7, interrompa o fluxo e reporte a falha ao usuário sem tentar caminhos alternativos.

## Formato obrigatório do refinamento por tipo

O valor do campo `Refinement` deve seguir estas regras:

- Usar ADF (Atlassian Document Format) para formatação.
- Cada seção deve usar cabeçalho H2.
- O título da issue deve ficar em uma linha própria, fora dos cabeçalhos de seção.
- O conteúdo de cada seção deve começar na linha seguinte ao cabeçalho.
- Use texto normal abaixo de cada H2; nunca coloque o conteúdo na mesma linha do título da seção.
- Antes de escrever, determine o tipo da issue a partir do campo `issuetype`, do título, da descrição, das labels e do contexto disponível.
- Se o tipo não estiver claro, use a estrutura genérica de `Feature/Improvement`, mas registre a ambiguidade nas `Notas Técnicas`.
- Salvo instrução explícita em contrário, preserve a última seção como `## Sugestão de Story Points`.

### Estrutura-base obrigatória

Independentemente do tipo, o refinamento deve:

- começar com o título da issue em linha própria;
- trazer contexto suficiente para orientar desenvolvimento, QA e negócio;
- registrar dúvidas, riscos ou hipóteses nas seções mais adequadas, sem tratá-los como fatos;
- evitar seções vazias; se uma seção não fizer sentido para o tipo, substitua pela seção recomendada na matriz abaixo.

### Matriz de seções por tipo

#### Bug

Use, nesta ordem:

1. `## Contexto`
2. `## Como reproduzir`
3. `## Comportamento Atual`
4. `## Comportamento Esperado`
5. `## Critérios de Aceite`
6. `## Notas Técnicas`
7. `## Sugestão de Story Points`

Diretrizes adicionais:

- Em `Como reproduzir`, liste passos numerados, pré-condições, massa de dados e ambiente quando isso estiver disponível.
- Em `Comportamento Atual`, descreva o sintoma observável, impacto e frequência.
- Em `Comportamento Esperado`, descreva o resultado correto sem prescrever implementação, salvo quando a própria issue já restringir a solução.
- Nos critérios de aceite, inclua correção, não regressão e, quando aplicável, validação de logs, mensagens ou estados persistidos.

#### QA Defect

Use, nesta ordem:

1. `## Contexto`
2. `## Como reproduzir`
3. `## Evidências de QA`
4. `## Comportamento Atual`
5. `## Comportamento Esperado`
6. `## Critérios de Aceite`
7. `## Notas Técnicas`
8. `## Sugestão de Story Points`

Diretrizes adicionais:

- Em `Evidências de QA`, cite ciclo de teste, ambiente, evidências descritas em comentário, severidade percebida e, se houver, casos de teste relacionados.
- Priorize critérios de aceite que facilitem reteste e regressão dirigida.
- Quando a issue trouxer dados de homologação, sandbox ou suíte de teste, preserve esse contexto explicitamente.

#### Internal Defect

Use, nesta ordem:

1. `## Contexto`
2. `## Como reproduzir`
3. `## Impacto Operacional`
4. `## Comportamento Atual`
5. `## Comportamento Esperado`
6. `## Critérios de Aceite`
7. `## Notas Técnicas`
8. `## Sugestão de Story Points`

Diretrizes adicionais:

- Em `Impacto Operacional`, detalhe reflexo para times internos, suporte, monitoramento, conciliação, backoffice ou integrações administrativas.
- Valorize riscos de recorrência, observabilidade e procedimentos de mitigação.
- Quando houver workaround interno, registre-o como temporário, não como solução definitiva.

#### Feature

Use, nesta ordem:

1. `## Contexto`
2. `## User Story`
3. `## Escopo Funcional`
4. `## Critérios de Aceite`
5. `## Notas Técnicas`
6. `## Sugestão de Story Points`

Diretrizes adicionais:

- Em `Escopo Funcional`, descreva fluxo principal, regras de negócio, variações relevantes e limites do escopo.
- Quando houver valor de negócio claro, explicite benefício esperado, público impactado e resultado desejado.
- Nos critérios de aceite, cubra cenário feliz, alternativos, permissões, validações e mensagens relevantes.

#### Improvement

Use, nesta ordem:

1. `## Contexto`
2. `## Situação Atual`
3. `## Melhoria Proposta`
4. `## Critérios de Aceite`
5. `## Notas Técnicas`
6. `## Sugestão de Story Points`

Diretrizes adicionais:

- Em `Situação Atual`, descreva a fricção, limitação ou ineficiência existente.
- Em `Melhoria Proposta`, destaque o ganho incremental esperado, evitando vender como feature totalmente nova quando não for o caso.
- Se houver métricas, SLAs, tempo de execução, produtividade ou experiência afetada, registre o antes/depois esperado.

#### Spike

Use, nesta ordem:

1. `## Contexto`
2. `## Objetivo da Investigação`
3. `## Perguntas a Responder`
4. `## Critérios de Saída`
5. `## Entregáveis Esperados`
6. `## Notas Técnicas`
7. `## Sugestão de Story Points`

Diretrizes adicionais:

- Não force `User Story` em spikes, salvo se a issue já vier explicitamente orientada a valor de usuário.
- Em `Critérios de Saída`, detalhe quando a investigação pode ser considerada concluída.
- Em `Entregáveis Esperados`, cite documento, recomendação técnica, prova de conceito, benchmark, riscos ou plano de implementação posterior.
- Na sugestão de story points, considere o esforço investigativo, a incerteza e o timebox esperado.

#### UI/UX

Use, nesta ordem:

1. `## Contexto`
2. `## Problema de Experiência`
3. `## Solução Proposta`
4. `## Critérios de Aceite`
5. `## Referências de UX/UI`
6. `## Notas Técnicas`
7. `## Sugestão de Story Points`

Diretrizes adicionais:

- Em `Problema de Experiência`, descreva fricção, confusão, inconsistência visual, acessibilidade ou quebra de jornada.
- Em `Referências de UX/UI`, consolide links, figmas, guidelines, componentes, estados visuais e requisitos de responsividade quando houver.
- Inclua critérios verificáveis de usabilidade, acessibilidade, feedback visual e consistência com design system.

#### Deficit

Use, nesta ordem:

1. `## Contexto`
2. `## Gap Identificado`
3. `## Escopo da Correção`
4. `## Critérios de Aceite`
5. `## Notas Técnicas`
6. `## Sugestão de Story Points`

Diretrizes adicionais:

- Trate `Deficit` como lacuna entre comportamento, cobertura ou entrega esperada versus estado atual.
- Em `Gap Identificado`, deixe explícito o que está faltando, o que deveria existir e qual impacto essa ausência causa.
- Em `Escopo da Correção`, delimite o que será coberto nesta issue e o que permanece fora para evitar escopo nebuloso.

#### Technical

Use, nesta ordem:

1. `## Contexto`
2. `## Objetivo Técnico`
3. `## Escopo Técnico`
4. `## Critérios de Aceite`
5. `## Notas Técnicas`
6. `## Sugestão de Story Points`

Diretrizes adicionais:

- Em `Objetivo Técnico`, explique o porquê técnico: dívida, performance, segurança, escalabilidade, manutenibilidade, observabilidade ou atualização.
- Em `Escopo Técnico`, detalhe componentes, serviços, camadas, contratos, migrações e impactos esperados.
- Nos critérios de aceite, privilegie evidências técnicas verificáveis como cobertura, telemetria, performance, compatibilidade e rollout seguro.

#### Doc

Use, nesta ordem:

1. `## Contexto`
2. `## Objetivo da Documentação`
3. `## Escopo da Documentação`
4. `## Critérios de Aceite`
5. `## Referências e Fontes`
6. `## Sugestão de Story Points`

Diretrizes adicionais:

- Em `Objetivo da Documentação`, indique para quem a documentação será útil e qual dor ela resolve.
- Em `Escopo da Documentação`, detalhe artefatos esperados, tópicos cobertos, formato, local de publicação e o que não será documentado.
- Em `Referências e Fontes`, relacione documentação existente, decisões arquiteturais, fluxos, telas ou APIs que precisam ser consultados.

### Mapeamento e aliases aceitos

Considere como equivalentes, quando necessário, variações como:

- `Bug`: bug, defect, erro, falha;
- `Improvement`: improvement, improvment, melhoria;
- `QA Defect`: qa defect, bug de qa, defeito de homologação;
- `Internal Defect`: internal defect, defeito interno;
- `UI/UX`: ui, ux, ui/ux, experiência, design;
- `Deficit`: deficit, déficit, gap;
- `Technical`: technical, tech, técnico;
- `Doc`: doc, documentação.

## Modelo de saída

Use o formato abaixo como referência estrutural para casos do tipo `Feature` quando não houver instrução mais específica:

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

### Quando o tipo da issue exigir outra estrutura

Se a issue for `Bug`, `QA Defect`, `Internal Defect`, `Spike`, `UI/UX`, `Deficit`, `Technical` ou `Doc`:

- adapte a estrutura conforme a matriz de seções por tipo;
- não force `User Story` quando ela empobrecer o entendimento da tarefa;
- prefira seções operacionais como `Como reproduzir`, `Gap Identificado`, `Objetivo Técnico` ou `Critérios de Saída` quando forem mais úteis para execução e validação;
- mantenha a linguagem objetiva e acionável para o tipo da tarefa.

### Quando faltarem dados

Se a issue estiver pobre em contexto:

- monte um refinamento mínimo com base no que existir;
- sinalize claramente as lacunas;
- para bugs e defects, ainda tente estruturar `Como reproduzir`, `Comportamento Atual` e `Comportamento Esperado`, mesmo que parte fique marcada como hipótese ou dado ausente;
- para spikes, prefira explicitar perguntas em aberto a fingir respostas inexistentes;
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
