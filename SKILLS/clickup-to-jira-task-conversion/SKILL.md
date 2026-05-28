---
name: clickup-to-jira-task-conversion
description: 'Converte tarefas do ClickUp para Jira usando MCP. Use quando o usuário pedir para migrar, copiar, espelhar ou recriar uma tarefa do ClickUp no Jira, preservando título, descrição, critérios, todos os comentários, responsáveis, labels, prioridade, Pontos do Sprint, Story Points, Version, Fix Version, Release title, Release notes, épico e subtarefas. Use por padrão a instância https://colibri.atlassian.net/, no contexto Colibri / projeto COL / board DEV, preenchendo labels do Jira com `desktop`, e pergunte apenas quando algum campo obrigatório ou mapeamento crítico estiver ambíguo.'
argument-hint: 'Informe a tarefa do ClickUp; se quiser sobrescrever o padrão, informe também o projeto e tipo da issue no Jira.'
user-invocable: true
disable-model-invocation: false
---

# ClickUp para Jira

## O que esta skill faz

Esta skill lê todos os detalhes disponíveis de uma tarefa do ClickUp via MCP e cria a tarefa equivalente no Jira via jira MCP.

Ela deve preferir jira MCP como caminho principal, mas usar a API correspondente como fallback sempre que uma operação necessária não puder ser concluída via jira MCP.

Ela deve priorizar fidelidade funcional, clareza e confirmação mínima: perguntar apenas o que for indispensável para criar a issue corretamente no Jira.

Ela usa sempre ADF (Atlassian Document Format) para formataçao de texto compatível com o Jira ao invés de Markdown.

Ao enviar `body` para o Jira, trate tanto descrição quanto comentários como conteúdo estruturado em ADF, inclusive quando o comentário original for apenas texto simples.

## Quando usar

Use esta skill quando o usuário pedir algo como:

- converter tarefa do ClickUp para Jira
- migrar task do ClickUp para Jira
- recriar issue no Jira com base em uma tarefa do ClickUp
- copiar card do ClickUp para o Jira
- espelhar tarefa entre ClickUp e Jira
- criar issue equivalente no Jira a partir de item do ClickUp

## Entradas esperadas

Idealmente o usuário informa:

- identificador, URL ou nome da tarefa do ClickUp
- projeto do Jira, quando já souber
- tipo da issue no Jira, quando já souber

Na ausência de instrução diferente, use como padrão:

- instância Jira: `https://colibri.atlassian.net/`
- space/contexto: `Colibri`
- projeto Jira: `COL`
- board preferencial: `DEV`
- label padrão do Jira: `desktop`

Se projeto ou tipo da issue não estiverem claros e forem necessários para a criação, use o padrão acima. Pergunte apenas se ainda restar ambiguidade ou se o MCP exigir outro campo obrigatório.

Quando o tipo da issue não for informado nem inferível pelo tipo, status ou tags da tarefa no ClickUp, use `Story` como tipo padrão no Jira.

## Procedimento

1. Identifique a tarefa de origem no ClickUp.
   - Use o MCP do ClickUp para localizar a tarefa correta.
   - Se o MCP do ClickUp não conseguir localizar, listar ou expandir os dados necessários da tarefa, tente a API correspondente antes de concluir que a operação não é suportada.
   - Antes de iniciar a migração, verifique se a tarefa do ClickUp já possui status `MIGRATED` ou um comentário com link para o Jira. Se sim, informe ao usuário e pergunte se deseja duplicar a migração ou atualizar a issue existente.
   - Se houver ambiguidade, confirme qual tarefa deve ser usada.

2. Leia os detalhes completos da tarefa.
   - Capture pelo menos: título, descrição, status, prioridade, responsáveis, datas, labels/tags, checklist, campo `Pontos do Sprint`, Version, `Release title`, `Release notes`, épico relacionado, todas as subtarefas incluindo as fechadas (`closed`), links, todos os comentários e campos customizados disponíveis.
   - Se a descrição exceder `32.000` caracteres, preserve requisitos, critérios de aceite, checklist, links, campos estruturados e comentários na íntegra, e resuma apenas trechos narrativos, contexto histórico ou duplicações evidentes.

3. Monte um rascunho de equivalência para o Jira.
   - Título do ClickUp → summary do Jira.
   - Descrição do ClickUp → description do Jira.
   - Checklist, critérios ou passos → seção estruturada na descrição.
   - Na descrição gerada no Jira, todos os headers/títulos de seção devem ser formatados como `H2`, usando ADF (Atlassian Document Format).
   - Prioridade, pontos, versão, release, labels e épico devem seguir o mapeamento e o fallback definidos em `Tratamento de lacunas e incompatibilidades`.
   - Responsáveis, datas e links → mapear quando os campos existirem no projeto Jira.   
   - Subtarefas → sempre buscar e migrar todas as subtarefas do ClickUp, incluindo as fechadas (`closed`).
   - Subtarefas → criar automaticamente no Jira sempre que o MCP e o tipo de issue suportarem esse fluxo.

4. Determine os campos obrigatórios do destino.
   - Verifique se a instância Jira de destino é `https://colibri.atlassian.net/`, salvo se o usuário pedir explicitamente outra.
   - Verifique se o projeto Jira está definido.
   - Determine o tipo da issue a partir do tipo, tags ou contexto da tarefa no ClickUp; se isso não for possível com segurança, use `Story`.
   - Verifique os campos e entidades relacionados conforme o mapeamento definido em `Tratamento de lacunas e incompatibilidades`.
   - Para subtarefas, versões, épicos, comentários e demais entidades relacionadas, siga a `Regra geral de fallback MCP → API` antes de assumir limitação definitiva.
   - Se qualquer um deles estiver ausente ou ambíguo, pergunte ao usuário antes de criar.
   - Se houver mais de uma correspondência plausível de tipo, apresente opções curtas.

5. Crie a issue no Jira.
   - Use por padrão a instância `https://colibri.atlassian.net/`, o projeto `COL` e o contexto/space `Colibri`; se houver seleção de board aplicável, prefira `DEV`.
   - Use o jira MCP para criar a issue com os campos mapeados segundo `Tratamento de lacunas e incompatibilidades`.
   - Se o jira MCP não conseguir criar a issue, subtarefas, versão, comentários, vínculo de épico ou atualizar campos adicionais, siga a `Regra geral de fallback MCP → API`.
   - Se não for possível sincronizar o status da tarefa do Clickup com o JIRA, adicione um comentário ao final com o status original do clickup.
   - Preserve links de referência para a tarefa original do ClickUp.
   - Ao criar comentários no Jira, use um cabeçalho destacado antes do texto original, representado em ADF, por exemplo com um parágrafo em `strong`: `Comentário do ClickUp — <usuário> — <data original>`.
   - Quando o Jira não permitir preservar a autoria técnica original, mantenha no cabeçalho o nome do usuário do ClickUp e a data original para preservar contexto de auditoria.
   - Se suportado, crie as subtarefas equivalentes automaticamente, incluindo as que estiverem fechadas (`closed`) na origem.
   - Se o jira MCP não conseguir criar subtarefas, tente a API correspondente do Jira antes de desistir da criação.
   - Se não for suportado, descreva claramente quais subtarefas precisam ser recriadas depois.

6. Adicione os comentários migrados à issue do Jira.
   - Para cada comentário do ClickUp, crie um comentário correspondente no Jira usando o formato sugerido.
   - Sempre envie o `body` do comentário em ADF; não envie string simples quando a operação esperar documento estruturado.
   - Mesmo para comentários curtos, use ao menos um documento ADF com o cabeçalho de origem e um parágrafo com o texto original.
   - Preserve a ordem cronológica e inclua em cada comentário um cabeçalho em destaque com o usuário original do ClickUp e a data original do comentário.
   - Se o MCP não conseguir criar comentários, tente a API correspondente do Jira antes de registrar a limitação.
   - Se a criação do comentário falhar por formato, suspeite primeiro de payload fora de ADF antes de concluir que o Jira não aceita a operação.
   - Se houver limitação técnica que impeça a migração de comentários, informe claramente ao usuário quais comentários não puderam ser migrados e por quê.

7. Após a migração bem-sucedida, atualize o ClickUp.
   - Adicione um comentário na tarefa original do ClickUp com o link completo da issue criada no Jira, por exemplo: `https://colibri.atlassian.net/browse/COL-1234`.
   - O comentário deve deixar claro que a tarefa foi migrada com sucesso e apontar para a issue correspondente no Jira.
   - Tente criar esse comentário primeiro via MCP do ClickUp.
   - Se o MCP do ClickUp não conseguir criar o comentário com o link da issue migrada, tente a API correspondente do ClickUp antes de registrar limitação.
   - Depois que a issue do Jira, comentários essenciais, vínculos de épico, versões e subtarefas necessárias tiverem sido migrados com sucesso, altere o status da tarefa original do ClickUp para `MIGRATED`.
   - Altere também o status de todas as subtarefas do ClickUp para `MIGRATED`, incluindo as subtarefas que estavam fechadas (`closed`) antes da migração.
   - Tente atualizar esses status primeiro via MCP do ClickUp.
   - Se o MCP do ClickUp não conseguir atualizar o status da tarefa principal ou das subtarefas, tente a API correspondente do ClickUp antes de registrar limitação.
   - Só faça essa alteração de status quando a migração tiver sido concluída com sucesso; não marque como `MIGRATED` se a criação no Jira ou vínculos essenciais tiverem falhado.

## Regra geral de fallback MCP → API

- Para operações de leitura, criação, atualização, associação ou criação de entidades relacionadas, tente primeiro via MCP.
- Se o MCP falhar, não expuser a operação necessária ou não suportar determinado campo/entidade, tente a API correspondente antes de assumir fallback manual.
- Aplique essa regra especialmente a:
   - atualização de status no ClickUp após migração
   - criação de comentário no ClickUp com link da issue migrada
  - criação e associação de subtarefas
  - criação e atualização de versões / Fix Version
  - gravação de `Release title` e `Release notes`
  - criação e associação de épicos
  - criação de comentários
  - atualização de campos adicionais da issue
- Só use fallback em descrição, épico KBR ou ação manual quando MCP e API não resolverem a operação.

8. Confirme o resultado.
   - Informe chave, título e link da issue criada no Jira.
   - Resuma quaisquer campos que não puderam ser migrados automaticamente.
   - Informe que foi adicionado um comentário na tarefa do ClickUp com o link completo da issue criada no Jira, quando isso tiver sido concluído com sucesso.
   - Informe que a tarefa original do ClickUp e suas subtarefas foram marcadas como `MIGRATED`, quando isso tiver sido concluído com sucesso.
   - Sugira próximos passos se algo exigir ação manual.

## Regras de decisão

### Quando perguntar ao usuário

Pergunte somente se faltar algum item crítico, como:

- qual tarefa do ClickUp deve ser usada
- qual tipo da issue deve ser criado
- como tratar campos sem correspondência óbvia
- quando o padrão `COL` / `DEV` / `Colibri` não puder ser aplicado com segurança

### Quando não perguntar

Não interrompa para perguntas desnecessárias se:

- a tarefa do ClickUp estiver identificada de forma única
- a instância Jira `https://colibri.atlassian.net/` puder ser usada
- o projeto Jira já estiver explícito ou o padrão `COL` puder ser usado
- o tipo da issue já estiver explícito
- houver mapeamento óbvio para os campos principais

## Critérios de qualidade

Antes de concluir, verifique se:

- a tarefa correta do ClickUp foi usada
- foi verificado se a tarefa já estava `MIGRATED` ou se já existia comentário com link para Jira antes de iniciar a migração
- summary e description no Jira refletem o conteúdo principal da origem
- a issue foi criada na instância Jira `https://colibri.atlassian.net/`, salvo instrução explícita em contrário
- projeto e tipo da issue estão corretos
- o destino padrão `Colibri` / `COL` / `DEV` foi usado quando apropriado
- o campo `labels` da issue no Jira contém `desktop`
- os campos principais listados em `Tratamento de lacunas e incompatibilidades` foram migrados, associados ou preservados com o fallback correto
- todos os títulos/seções da descrição gerada no Jira usam `H2` com ADF (Atlassian Document Format)
- requisitos, links e contexto importante foram preservados
- todos os comentários disponíveis foram migrados ou, se houver limitação técnica, a perda foi informada claramente
- cada comentário migrado contém cabeçalho destacado com usuário do ClickUp e data original
- cada comentário migrado enviado ao Jira usa `body` em ADF, mesmo quando o conteúdo original era texto simples
- todas as subtarefas da origem, incluindo as fechadas (`closed`), foram consideradas na migração
- quando o MCP não suportou ou falhou em uma operação relevante, houve tentativa via API antes de aplicar fallback manual
- subtarefas foram criadas automaticamente quando possível
- foi criado um comentário na tarefa do ClickUp com o link completo da issue migrada no Jira
- a tarefa original do ClickUp foi atualizada para o status `MIGRATED` após sucesso da migração
- as subtarefas do ClickUp também foram atualizadas para `MIGRATED`, incluindo as que estavam `closed`
- limitações de migração foram informadas ao usuário
- a resposta final inclui o identificador da issue criada

## Formato sugerido para comentários migrados

Ao criar comentários no Jira, prefira este formato:

Cabeçalho em ADF com destaque forte contendo:

`Comentário do ClickUp — <usuário> — <data original>`

Em seguida, adicione o texto original do comentário em blocos ADF apropriados, sem perder quebras de linha relevantes.

Não use Markdown cru como formato final do comentário no Jira. Se a operação aceitar `body`, envie ADF válido.

## Tratamento de lacunas e incompatibilidades

Se algum campo do ClickUp não tiver equivalente direto no Jira:

- priorize preservar a informação na descrição
- deixe explícito o que foi convertido literalmente e o que foi resumido

| Campo no ClickUp | Destino no Jira | Fallback se indisponível |
| --- | --- | --- |
| Tipo da tarefa | Tipo da issue | Se não for informado nem inferível com segurança, use `Story` |
| Labels/tags | `labels` | Sempre preserve `desktop`; se não houver suporte a múltiplas labels, mantenha ao menos `desktop` |
| `Pontos do Sprint` | `Story Points`, `Points` ou `Estimate` | Preserve o valor original na descrição |
| Version | Fix Version | Tente criar a versão; se não for possível, preserve o valor original na descrição |
| `Release title` | Nome/título da versão correspondente | Tente gravar na versão; se não for possível, preserve na descrição |
| `Release notes` | Descrição/notas da versão correspondente | Tente gravar na versão; se não for possível, preserve na descrição |
| Épico | Épico correspondente no Jira | Tente localizar ou criar; se o campo vier vazio, use `KBR`; se ainda assim não for possível associar, preserve a referência na descrição |
| Comentários | Comentários da issue em ADF | Siga MCP → API; se falhar, informe quais comentários não foram migrados |
| Subtarefas | Subtarefas da issue | Siga MCP → API; se falhar, descreva claramente quais subtarefas precisam ser recriadas |
| Link da tarefa original | Descrição ou comentário de referência | Preserve pelo menos um link navegável para a origem |
| Status final da tarefa ClickUp | `MIGRATED` no ClickUp | Só atualize após sucesso da migração; se falhar via MCP e API, informe a limitação |

- Antes de qualquer fallback manual, siga a `Regra geral de fallback MCP → API`.
- Para o comentário final no ClickUp, tente registrar o link completo da issue migrada via MCP e depois via API; se ambos falharem, informe a limitação ao usuário.
- Para atualização final de status no ClickUp, só marque como `MIGRATED` quando a migração tiver sido bem-sucedida; se a atualização falhar via MCP e API, informe a limitação ao usuário.
- Informe ao usuário qualquer perda de estrutura, automação ou metadado.

## Formato sugerido para descrição no Jira

Sempre que ajudar, organize a descrição com seções curtas como:

- Todos os headers/títulos devem ser gerados como `H2`, no formato ADF (Atlassian Document Format).

- Contexto
- Objetivo
- Requisitos
- Checklist / subtarefas
- Links de referência
- Observações da migração

## Resultado esperado

Ao final, o usuário deve ter:

- uma issue criada no Jira equivalente à tarefa do ClickUp
- um resumo do que foi migrado
- visibilidade clara sobre o que precisou de decisão manual
