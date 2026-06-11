---
name: jira-aashari-mcp
description: 'Cria, edita e gerencia issues do Jira usando exclusivamente o servidor MCP @aashari/mcp-server-atlassian-jira (ferramentas: mcp__aashari_mcp-_jira_get, mcp__aashari_mcp-_jira_post, mcp__aashari_mcp-_jira_put, mcp__aashari_mcp-_jira_patch, mcp__aashari_mcp-_jira_delete). Use quando o usuário pedir para criar tarefa, abrir issue, editar campo, atualizar status, adicionar comentário, buscar issues por JQL, listar projetos ou transicionar issue no Jira. NÃO usar se o servidor MCP não estiver disponível na sessão.'
argument-hint: 'Descreva a operação desejada (ex: criar bug, editar descrição, buscar issues em aberto)'
---

# Jira via @aashari/mcp-server-atlassian-jira

## Pré-requisito obrigatório

**Antes de qualquer operação**, verificar se as ferramentas do servidor MCP estão disponíveis na sessão:

- `mcp__aashari_mcp-_jira_get`
- `mcp__aashari_mcp-_jira_post`
- `mcp__aashari_mcp-_jira_patch`
- `mcp__aashari_mcp-_jira_put`
- `mcp__aashari_mcp-_jira_delete`

Se **nenhuma** dessas ferramentas estiver disponível, parar imediatamente e exibir:

---
> ⚠️ **Servidor MCP não disponível**
>
> Esta skill requer o servidor MCP `@aashari/mcp-server-atlassian-jira` ativo na sessão.
>
> **Como instalar e ativar:**
> 1. Acesse https://mcpservers.org/servers/aashari/mcp-server-atlassian-jira
> 2. Adicione ao seu `mcp.json`:
>    ```json
>    "jira": {
>      "command": "npx",
>      "args": ["-y", "@aashari/mcp-server-atlassian-jira"],
>      "env": {
>        "ATLASSIAN_SITE_NAME": "<seu-site>",
>        "ATLASSIAN_USER_EMAIL": "<seu-email>",
>        "ATLASSIAN_API_TOKEN": "<seu-token>"
>      },
>      "type": "stdio"
>    }
>    ```
> 3. Reinicie o servidor MCP e tente novamente.
---

## Configuração padrão

- **Instância:** `https://colibri.atlassian.net/`
- **Projeto padrão:** `WIN`
- **Board padrão:** `Win | Sprints`

Inferir esses valores quando não fornecidos explicitamente.

## Operações e caminhos de API

### Buscar issues (JQL)
```
mcp__aashari_mcp-_jira_get
path: /rest/api/3/search/jql
params: { jql: "<query>", fields: "summary,status,assignee,priority" }
```

### Obter issue específica
```
mcp__aashari_mcp-_jira_get
path: /rest/api/3/issue/{issueKey}
```

### Criar issue
```
mcp__aashari_mcp-_jira_post
path: /rest/api/3/issue
body: {
  "fields": {
    "project": { "key": "WIN" },
    "summary": "...",
    "description": { /* ADF */ },
    "issuetype": { "name": "Bug" | "Story" | "Task" | ... },
    "priority": { "name": "Medium" },
    "labels": ["desktop"],
    "assignee": { "accountId": "..." }
  }
}
```

### Editar issue (campos parciais)
```
mcp__aashari_mcp-_jira_put
path: /rest/api/3/issue/{issueKey}
body: { "fields": { /* apenas os campos a alterar */ } }
```

### Adicionar comentário
```
mcp__aashari_mcp-_jira_post
path: /rest/api/3/issue/{issueKey}/comment
body: {
  "body": {
    "type": "doc",
    "version": 1,
    "content": [
      { "type": "paragraph", "content": [{ "type": "text", "text": "..." }] }
    ]
  }
}
```

### Transicionar issue

# 1. Buscar transições disponíveis
```
mcp__aashari_mcp-_jira_get
path: /rest/api/3/issue/{issueKey}/transitions
```

# 2. Executar transição
```
mcp__aashari_mcp-_jira_post
path: /rest/api/3/issue/{issueKey}/transitions
body: { "transition": { "id": "<transitionId>" } }
```

### Listar projetos
```
mcp__aashari_mcp-_jira_get
path: /rest/api/3/project/search
```

### Obter o id do board
```
mcp__aashari_mcp-_jira_get
path: /rest/agile/1.0/board
params: { projectKeyOrId: "WIN" }
```

### Obter o sprint ativo do board
``` 
mcp__aashari_mcp-_jira_get
path: /rest/agile/1.0/board/{boardId}/sprint?state=active
``` 

### Listar tipos de issue
```
mcp__aashari_mcp-_jira_get
path: /rest/api/3/issuetype
```

### Obter lista de versões de um projeto
```
mcp__aashari_mcp-_jira_get
path: /rest/api/3/project/{projectId}/versions
```

### Obter lista de componentes de um projeto
```
mcp__aashari_mcp-_jira_get
path: /rest/api/3/project/{projectId}/components
```

### Obter usuário atual logado

```
mcp__aashari_mcp-_jira_get
path: /rest/api/3/myself
```

### Buscar usuário por nome/email
```
mcp__aashari_mcp-_jira_get
path: /rest/api/3/user/search
params: { query: "<nome ou email>" }
```

## Formato ADF (Atlassian Document Format)

Todo texto rico (description, comment) **deve** usar ADF. Nunca enviar texto plano nesses campos.

```json
{
  "type": "doc",
  "version": 1,
  "content": [
    {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "Texto aqui." }]
    }
  ]
}
```

Para listas:
```json
{
  "type": "bulletList",
  "content": [
    { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Item" }] }] }
  ]
}
```

## Workflow padrão para criação de issue

1. Confirmar projeto (`WIN` se não informado)
2. Confirmar tipo de issue (inferir pelo contexto: bug → Bug, funcionalidade → Story, etc.)
3. **Gerar a descrição usando a skill `jira-issue-description-generator`** antes de criar a issue:
   - Invocar a skill passando o tipo de issue inferido e o contexto da conversa/workspace
   - A skill retorna Markdown estruturado — converter para ADF antes de enviar à API
4. Inferir `assignee` se mencionado; caso contrário, omitir o campo
5. Inferir componente pelo contexto do workspace se possível
6. Aplicar label `desktop` por padrão
7. Criar via `mcp__aashari_mcp-_jira_post` → `/rest/api/3/issue`
8. Retornar link da issue criada: `https://colibri.atlassian.net/browse/{key}`

### Conversão Markdown → ADF (saída do jira-issue-description-generator)

A skill `jira-issue-description-generator` produz Markdown puro. Ao montar o campo `description` para a API, converter:

| Markdown | ADF node |
|----------|----------|
| Parágrafo | `{ "type": "paragraph", "content": [{ "type": "text", "text": "..." }] }` |
| `## Título` | `{ "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "..." }] }` |
| `- item` | `bulletList` > `listItem` > `paragraph` |
| `**negrito**` | `text` com `"marks": [{ "type": "strong" }]` |
| `_itálico_` | `text` com `"marks": [{ "type": "em" }]` |
| `` `código` `` | `text` com `"marks": [{ "type": "code" }]` |
| Bloco de código | `{ "type": "codeBlock", "attrs": { "language": "..." }, "content": [...] }` |

## Workflow padrão para edição de issue

1. Obter issue atual com `mcp__aashari_mcp-_jira_get` → `/rest/api/3/issue/{key}`
2. Identificar apenas os campos a alterar
3. Enviar `mcp__aashari_mcp-_jira_put` com somente os campos modificados
4. Confirmar alteração

## Tratamento de respostas truncadas

Se a resposta indicar truncamento (>40k chars), usar filtros JMESPath (`jq`) para reduzir o payload:
```
jq: "issues[].{key: key, summary: fields.summary, status: fields.status.name}"
```

## Perguntar apenas quando necessário

Inferir ao máximo pelo contexto. Perguntar somente quando:
- O projeto não puder ser inferido e for diferente de `COL`
- O tipo de issue for ambíguo entre dois tipos
- O `assignee` for mencionado mas o `accountId` não puder ser resolvido
