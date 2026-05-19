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

Ela usa sempre a sintaxe de formatação de texto compatível como Jira ao invés de Markdown.

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

## Procedimento

1. Identifique a tarefa de origem no ClickUp.
   - Use o MCP do ClickUp para localizar a tarefa correta.
   - Se o MCP do ClickUp não conseguir localizar, listar ou expandir os dados necessários da tarefa, tente a API correspondente antes de concluir que a operação não é suportada.
   - Se houver ambiguidade, confirme qual tarefa deve ser usada.

2. Leia os detalhes completos da tarefa.
   - Capture pelo menos: título, descrição, status, prioridade, responsáveis, datas, labels/tags, checklist, campo `Pontos do Sprint`, Version, `Release title`, `Release notes`, épico relacionado, todas as subtarefas incluindo as fechadas (`closed`), links, todos os comentários e campos customizados disponíveis.
   - Se houver conteúdo muito extenso, preserve o essencial e resuma o restante sem perder requisitos.

3. Monte um rascunho de equivalência para o Jira.
   - Título do ClickUp → summary do Jira.
   - Descrição do ClickUp → description do Jira.
   - Checklist, critérios ou passos → seção estruturada na descrição.
   - Na descrição gerada no Jira, todos os headers/títulos de seção devem ser formatados como `H2`, usando `## <título>`.
   - Prioridade → prioridade equivalente no Jira, quando existir correspondência razoável.
   - Campo `Pontos do Sprint` do ClickUp → mapear para `Story Points` ou `Points` ou `Estimate` no Jira, preservando o valor numérico original sempre que houver campo compatível no projeto ou board. Se não conseguir, adicione na descrição em destaque: STORY POINTS NO CLICKUP: X.
   - Version do ClickUp → mapear para Fix Version no Jira quando existir uma versão correspondente no projeto de destino.
   - `Release title` do ClickUp → migrar para os metadados da versão correspondente no Jira sempre que houver campo compatível; se a versão precisar ser criada, use esse valor como nome/título de release quando fizer sentido.
   - `Release notes` do ClickUp → migrar para a descrição/notas da versão correspondente no Jira sempre que houver suporte na entidade de versão do projeto.
   - Se a versão correspondente não existir no Jira, tente criá-la antes de concluir a criação ou atualização da issue.
   - Labels → preencher o campo `labels` do Jira com `desktop`.
   - Se houver labels úteis do ClickUp e o destino suportar múltiplas labels, preserve `desktop` e adicione as demais labels relevantes sem duplicação.
   - Épico do ClickUp → localizar o épico correspondente no Jira.
   - Se o campo de épico vier vazio, nulo ou sem valor útil no ClickUp, use diretamente o épico `KBR` no Jira.
   - Se o épico correspondente não existir no Jira, crie primeiro um épico com as mesmas regras de migração de tarefas, adaptadas ao tipo `Epic`.
   - Depois de localizar ou criar o épico, associe a tarefa migrada a esse épico no Jira.
   - Responsáveis, datas e links → mapear quando os campos existirem no projeto Jira.   
   - Subtarefas → sempre buscar e migrar todas as subtarefas do ClickUp, incluindo as fechadas (`closed`).
   - Subtarefas → criar automaticamente no Jira sempre que o MCP e o tipo de issue suportarem esse fluxo.

4. Determine os campos obrigatórios do destino.
   - Verifique se a instância Jira de destino é `https://colibri.atlassian.net/`, salvo se o usuário pedir explicitamente outra.
   - Verifique se o projeto Jira está definido.
   - Verifique se o tipo da issue está definido.
   - Verifique se o campo `Story Points` está disponível para o projeto/tipo/board de destino quando a tarefa de origem tiver valor em `Pontos do Sprint`.
   - Verifique se a Fix Version correspondente à Version do ClickUp já existe no projeto Jira de destino.
   - Verifique se os metadados de versão do Jira permitem registrar `Release title` e `Release notes` na versão correspondente.
   - Se não existir, tente criar a versão no projeto antes de associá-la à issue.
   - Verifique se o épico do ClickUp já existe no Jira e pode ser associado à tarefa migrada.
   - Se o campo de épico estiver vazio no ClickUp, prepare a associação direta da tarefa ao épico `KBR` no Jira.
   - Se o épico não existir, prepare a criação prévia do épico no Jira antes da tarefa filha.
   - Para subtarefas, versões, épicos, comentários e demais campos/entidades relacionadas, prefira MCP; se o MCP não suportar a operação ou falhar na execução, prepare fallback via API antes de assumir limitação definitiva.
   - Se qualquer um deles estiver ausente ou ambíguo, pergunte ao usuário antes de criar.
   - Se houver mais de uma correspondência plausível de tipo, apresente opções curtas.

5. Crie a issue no Jira.
   - Use por padrão a instância `https://colibri.atlassian.net/`, o projeto `COL` e o contexto/space `Colibri`; se houver seleção de board aplicável, prefira `DEV`.
   - Se a tarefa do ClickUp pertencer a um épico, confirme se o épico correspondente já existe no Jira.
   - Se o campo de épico estiver vazio no ClickUp, associe a tarefa migrada ao épico `KBR` no Jira.
   - Se não existir, crie primeiro o épico no Jira usando as mesmas regras desta skill, adaptando o tipo da issue para `Epic` e reaproveitando descrição, comentários, labels, Version/Fix Version, `Release title`/`Release notes`, `Pontos do Sprint`/`Story Points` quando fizer sentido e demais campos compatíveis.
   - Use o jira MCP para criar a issue com os campos mapeados.
   - Se o jira MCP não conseguir criar a issue, subtarefas, versão, comentários, vínculo de épico ou atualizar campos adicionais, tente a API correspondente do Jira antes de declarar falha.
   - Preencha o campo `labels` com `desktop` por padrão.
   - Se houver labels relevantes no ClickUp e fizer sentido mantê-las, preserve `desktop` e acrescente as demais labels úteis sem duplicação.
   - Se houver valor em `Pontos do Sprint` na tarefa de origem e o destino suportar `Story Points`, `Points` ou `Estimate`, grave o valor correspondente na issue criada.
   - Se o destino não suportar `Story Points` diretamente, preserve o valor original de `Pontos do Sprint` na descrição e informe a limitação ao usuário.
   - Se a tarefa de origem tiver Version, associe a Fix Version correspondente na issue do Jira.
   - Se a Fix Version ainda não existir e puder ser criada, crie-a antes de concluir a associação.
   - Se o jira MCP não conseguir criar ou associar a versão, tente a API do Jira para criar/atualizar a versão e associá-la à issue.
   - Se houver `Release title` e/ou `Release notes`, grave esses dados na versão correspondente do Jira sempre que o jira MCP e o projeto suportarem edição/criação desses metadados.
   - Se a versão precisar ser criada no Jira, inclua `Release title` e `Release notes` já na criação da versão, sempre que possível.
   - Se o jira MCP não conseguir gravar `Release title` e/ou `Release notes`, tente a API correspondente antes de usar fallback em descrição.
   - Se não for possível criar ou associar a Fix Version, preserve o valor original da Version na descrição e informe a limitação ao usuário.
   - Se não for possível gravar `Release title` e/ou `Release notes` diretamente na versão do Jira, preserve esses valores na descrição da issue e informe a limitação ao usuário.
   - Se houver épico correspondente ou recém-criado, associe a tarefa migrada a esse épico.
   - Se o jira MCP não conseguir criar ou associar o épico, tente a API correspondente antes de aplicar o fallback configurado.
   - Se não for possível sincronizar o status da tarefa do Clickup com o JIRA, adicione um comentário ao final com o status original do clickup.
   - Se não for possível criar ou associar o épico, use o épico KBR.
   - Preserve links de referência para a tarefa original do ClickUp.
   - Ao criar comentários no Jira, use um cabeçalho destacado antes do texto original, por exemplo: `**Comentário do ClickUp — <usuário> — <data original>**`.
   - Quando o Jira não permitir preservar a autoria técnica original, mantenha no cabeçalho o nome do usuário do ClickUp e a data original para preservar contexto de auditoria.
   - Se suportado, crie as subtarefas equivalentes automaticamente, incluindo as que estiverem fechadas (`closed`) na origem.
   - Se o jira MCP não conseguir criar subtarefas, tente a API correspondente do Jira antes de desistir da criação.
   - Se não for suportado, descreva claramente quais subtarefas precisam ser recriadas depois.

6. Adicione os comentários migrados à issue do Jira.
   - Para cada comentário do ClickUp, crie um comentário correspondente no Jira usando o formato sugerido.
   - Preserve a ordem cronológica e inclua em cada comentário um cabeçalho em destaque com o usuário original do ClickUp e a data original do comentário.
   - Se o MCP não conseguir criar comentários, tente a API correspondente do Jira antes de registrar a limitação.
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
- summary e description no Jira refletem o conteúdo principal da origem
- a issue foi criada na instância Jira `https://colibri.atlassian.net/`, salvo instrução explícita em contrário
- projeto e tipo da issue estão corretos
- o destino padrão `Colibri` / `COL` / `DEV` foi usado quando apropriado
- o campo `labels` da issue no Jira contém `desktop`
- o campo `Pontos do Sprint` do ClickUp foi migrado para `Story Points` no Jira com o mesmo valor quando o destino suportava esse campo
- Version do ClickUp foi mapeada para Fix Version no Jira quando existia ou pôde ser criada a versão correspondente
- `Release title` e `Release notes` foram migrados para a versão correspondente no Jira quando o destino suportava esses metadados
- o épico do ClickUp foi localizado ou criado no Jira antes da tarefa migrada, quando aplicável
- a tarefa migrada foi associada ao épico correto no Jira, quando aplicável
- quando o campo de épico veio vazio no ClickUp, a tarefa foi associada ao épico `KBR` no Jira
- todos os títulos/seções da descrição gerada no Jira usam `H2` (`##`)
- requisitos, links e contexto importante foram preservados
- todos os comentários disponíveis foram migrados ou, se houver limitação técnica, a perda foi informada claramente
- cada comentário migrado contém cabeçalho destacado com usuário do ClickUp e data original
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

`**Comentário do ClickUp — <usuário> — <data original>**`

Em seguida, adicione o texto original do comentário sem perder quebras de linha relevantes.

## Tratamento de lacunas e incompatibilidades

Se algum campo do ClickUp não tiver equivalente direto no Jira:

- priorize preservar a informação na descrição
- deixe explícito o que foi convertido literalmente e o que foi resumido
- para `Pontos do Sprint`, mantenha o valor original registrado na descrição quando o campo `Story Points` do Jira não estiver disponível
- para Version, mantenha o valor original registrado na descrição quando a Fix Version correspondente não existir e não puder ser criada
- para `Release title` e `Release notes`, mantenha os valores originais registrados na descrição quando os metadados de versão do Jira não estiverem disponíveis ou não puderem ser atualizados
- para épico, mantenha a referência ao épico original registrada na descrição quando não for possível localizar, criar ou associar o épico correspondente no Jira
- se o campo de épico estiver vazio no ClickUp, use o épico `KBR` no Jira como fallback padrão
- antes de qualquer fallback manual, tente resolver a operação via API se o MCP falhar ou não suportar a operação
- para o comentário final no ClickUp, tente registrar o link completo da issue migrada via MCP e depois via API; se ambos falharem, informe a limitação ao usuário
- para atualização final de status no ClickUp, só marque como `MIGRATED` quando a migração tiver sido bem-sucedida; se a atualização falhar via MCP e API, informe a limitação ao usuário
- informe ao usuário qualquer perda de estrutura, automação ou metadado

## Formato sugerido para descrição no Jira

Sempre que ajudar, organize a descrição com seções curtas como:

- Todos os headers/títulos devem ser gerados como `H2`, no formato `## <título>`.

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
