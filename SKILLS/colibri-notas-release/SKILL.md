---
name: colibri-notas-release
description: 'Notas de release de uma versão (Fix Version) do Jira, publicadas no Confluence e no Slack. Use quando o usuário pedir as notas de release de uma versão do Jira. Não use para a nota de release do market-place nem para liberar pacotes em produção (use colibri-deploy-producao).'
argument-hint: 'Informe o nome exato da versão do Jira (por exemplo: Tablet 2.2).'
---

# Notas de release

Esta skill monta as notas de uma versão do Jira com os campos Release title e Release notes dos chamados. Depois, ela publica 1 página no Confluence e 1 arquivo `.md` com as notas no Slack. As 2 publicações são visíveis para outras pessoas: faça as duas só depois da aprovação do passo 4.

## Constantes

Os passos citam estes itens pelo nome. Os valores ficam só aqui.

| Item | Valor |
|---|---|
| Site Atlassian | `colibri.atlassian.net` (obtenha o `cloudId` com `getAccessibleAtlassianResources`) |
| Campo Release title | `customfield_10088` |
| Campo Release notes | `customfield_10089` |
| Espaço do Confluence | "Colibri Windows", chave `main` |
| Página Releases | id `4128769` |
| Canal do Slack | `#comunicados`, id `CT9TU0QCD`, workspace "Sistema Colibri" |

Grupos, na ordem de exibição:

| Issue Type | Título do grupo |
|---|---|
| Emergency | Urgências resolvidas |
| Bug | O que foi consertado |
| Feature | O que há de novo |
| Improvement | O que foi melhorado |
| Technical | O que foi ajustado |

Um tipo fora da tabela forma um grupo com o nome do próprio tipo, depois de Technical, em ordem alfabética.

## Ferramentas

- MCP do Atlassian com `discover` e `executeRead`/`executeWrite` (conector v2). Operações diretas: `searchJiraIssuesUsingJql`, `getJiraIssue`, `searchConfluence`, `getConfluenceContent`, `createConfluenceContent`, `updateConfluenceContent`. Operações pelo `execute*`: `getConfluenceContentAncestors`, `downloadJiraIssueAttachment`, `createConfluenceAttachment`.
- MCP do Slack autenticado no workspace do canal, com as ferramentas de envio de arquivo: `slack_get_file_upload_url` e `slack_complete_file_upload`.
- `curl`, para enviar os bytes do arquivo ao Slack.

## Passo 1: Ler a versão e os chamados

1. Se o usuário não deu o nome da versão, **Pergunte**.
2. Chame `searchJiraIssuesUsingJql` com `jql: fixVersion = "<versão>" ORDER BY key DESC`, `maxResults: 100` e `fields` com `issuetype`, `project`, `fixVersions` e os 2 campos de release. Deixe `view` sem valor: a lista de `fields` mantém a resposta pequena.
3. Enquanto `pageInfo.hasNextPage` for verdadeiro, repita a mesma chamada com `nextPageToken` igual ao `pageInfo.endCursor`.
4. Se a busca falha ou não retorna chamados, diga isso ao usuário e pare: o nome da versão tem de ser exato.
5. Se os chamados são de mais de 1 projeto, **Pergunte** qual projeto vale e mantenha só os chamados dele.
6. Em `fixVersions` de um chamado, ache o item com `name` igual à versão. A data de release é o `releaseDate` dele (`yyyy-mm-dd`). Sem `releaseDate`, use a data de hoje.
7. Separe os chamados em 2 listas: **incluídos** (os 2 campos de release preenchidos) e **descartados** (falta 1 dos 2 campos). Guarde a chave de cada chamado descartado para a revisão.

*Pronto quando:* todas as páginas da busca foram lidas e cada chamado está em exatamente 1 das 2 listas.

## Passo 2: Localizar as imagens

O campo Release notes chega em markdown. Uma imagem aparece como `![](blob:https://media...)`. Esse endereço não serve para copiar a imagem.

Para cada chamado incluído com `![](blob:` nas notas:

1. Chame `getJiraIssue` com `expand: "renderedFields"` e `fields` só com o campo Release notes.
2. No HTML de `renderedFields`, cada `<img>` tem `src` terminado em `/attachment/content/<id>` e `alt` com o nome do arquivo. Guarde o `<id>` e o nome, na ordem em que aparecem. A enésima imagem do HTML é a enésima imagem do markdown.
3. Se o número de `<img>` é diferente do número de imagens do markdown, ou um `src` tem outro formato, marque as imagens desse chamado como **não copiáveis**.

*Pronto quando:* cada imagem das notas tem um id de anexo ou a marca "não copiável".

## Passo 3: Montar as notas

Monte 1 documento em markdown com esta estrutura:

```markdown
**Liberado em:** dd/mm/aa

---

## <Título do grupo>

### <Release title>

<Release notes>

### <Release title>

<Release notes>

---

## <Título do grupo>
```

- Coloque uma linha `---` antes de cada grupo. Omita os grupos sem chamados.
- Dentro do grupo, mantenha a ordem da busca (chave decrescente), igual à das páginas existentes.
- Copie o Release title e o Release notes sem mudar o texto, o idioma nem a formatação (listas, negrito, links). O documento contém só esses 2 campos: chaves, prioridades e responsáveis ficam fora.
- No lugar de cada imagem, escreva o marcador `[imagem: <nome do arquivo>]` ou `[imagem não copiável]`. Os marcadores existem só para a revisão.

*Pronto quando:* cada chamado incluído aparece 1 vez, no grupo do seu Issue Type.

## Passo 4: Revisão e aprovação

1. Confira se a página já existe: `searchConfluence` com `cql: space = "<chave do espaço>" AND type = page AND title = "<versão>"`. Se existe, guarde o id dela.
2. Proponha a página-mãe. A árvore real é Releases → produto (→ subproduto) → versão, e o nome da página de produto nem sempre é igual ao nome do produto na versão.
   - O produto é o nome da versão sem o número final (`CBO Connect 1.9.5` → `CBO Connect`).
   - Chame `searchConfluence` com `cql: ancestor = <id da página Releases> AND type = page AND title ~ "<produto>" ORDER BY created DESC`.
   - Escolha a página mais recente com título `<produto> <número>` e número diferente do número desta versão. Chame `getConfluenceContentAncestors` com o id dela: o último item da lista é a página-mãe proposta.
   - Se nenhuma página tem esse título, a página-mãe proposta é a página Releases.
3. Confira que as 2 ferramentas de envio de arquivo do Slack estão disponíveis nesta sessão.
4. Mostre ao usuário, numa só mensagem:
   - as notas do passo 3;
   - a página-mãe proposta (título e caminho desde Releases);
   - o canal do Slack que recebe o arquivo;
   - as chaves dos chamados descartados;
   - as imagens não copiáveis, com a chave do chamado;
   - os avisos: página que já existe, Slack indisponível.
5. **Pergunte** se publica. Inclua nas opções:
   - página-mãe: a proposta, a página Releases ou outra que o usuário indicar;
   - se a página já existe: atualizar a página ou parar;
   - se o Slack está indisponível: publicar só no Confluence ou parar para o usuário autenticar o Slack.
6. Se o usuário pede mudanças no texto, aplique e mostre de novo.

*Pronto quando:* o usuário aprovou o texto, a página-mãe e o destino (Confluence e Slack, ou só Confluence).

## Passo 5: Publicar no Confluence

1. Converta as notas para HTML neste formato, igual ao das páginas existentes:

   ```html
   <p><strong>Liberado em:</strong> dd/mm/aa</p>
   <hr><h2>Título do grupo</h2>
   <h3>Release title</h3><p>Release notes</p>
   ```

   Tire os marcadores de imagem do passo 3: nesta primeira gravação, o corpo tem só texto.
2. Grave a página:
   - **Página nova:** `createConfluenceContent` com `contentType: "page"`, `title` igual ao nome da versão, `parent: {"parentContentId": "<id da página-mãe>"}` e `body: {"format": "html", "value": "<html>"}`.
   - **Página que já existe:** leia a página com `getConfluenceContent` (`draft: true`, `detail: "full"`, `content_format: "html"`). Chame `updateConfluenceContent` com o `snapshotToken` da leitura e o mesmo `body`.
3. Guarde o id, a URL e o `snapshot.token` da resposta.
4. Para cada imagem copiável, numa pasta temporária:
   - chame `downloadJiraIssueAttachment` (`executeRead`) com `attachmentId` e `outputPath`; rode o comando que a resposta traz;
   - chame `createConfluenceAttachment` (`executeWrite`) com o `contentId` da página e `localFilePath`; rode o comando que a resposta traz e guarde o id de mídia e a coleção do resultado.
5. Se pelo menos 1 imagem subiu, chame `updateConfluenceContent` com o `snapshotToken` mais recente e o HTML inteiro da página. Coloque cada imagem na posição dela nas notas:

   ```html
   <figure data-type="media-single" data-layout="center" data-width="60" data-width-type="percentage"><div data-type="media" data-media-type="file" data-id="ID_DE_MIDIA" data-collection="COLECAO" data-alt="arquivo.png"></div></figure>
   ```

6. Se o download ou o envio de uma imagem falha, continue com as outras. A página fica sem essa imagem, e a imagem entra na lista de não copiadas do relatório.
7. Se `updateConfluenceContent` responde `snapshot_stale`, leia a página de novo e repita a chamada com o token novo.

*Pronto quando:* a página existe com o título da versão, e cada imagem está na página ou na lista de não copiadas.

## Passo 6: Enviar ao Slack

Faça este passo logo depois do passo 5, sem outra pergunta, se o usuário aprovou o Slack.

1. Grave as notas do passo 3 num arquivo `.md`, numa pasta temporária, em UTF-8. O nome do arquivo é o nome da versão com `-` no lugar dos espaços (`Tablet 2.2` → `Tablet-2.2.md`).
   - A primeira linha é o título `# <versão>`.
   - Tire os marcadores de imagem. Se as notas têm imagens, escreva no fim: `As imagens estão na página do Confluence.`
   - A última linha é a URL da página do Confluence.
2. Leia o tamanho exato do arquivo em bytes (`wc -c < <arquivo>`).
3. Chame `slack_get_file_upload_url` com `filename` e `content_length` igual a esse tamanho. Guarde o `file_id` e a URL de envio.
4. Envie os bytes com `curl`. Coloque a URL numa variável do shell, sem mudar nenhum caractere dela:

   ```bash
   URL='<URL de envio>' && curl -sS -X POST "$URL" -H 'Content-Type: text/markdown' -H 'Content-Length: <tamanho>' --data-binary @<arquivo>
   ```

5. Chame `slack_complete_file_upload` com o `file_id`, `channel_id` igual ao id do canal do Slack das constantes, `title` igual a `Notas de release: <versão>` e `initial_comment` com 2 linhas: `Notas de release: <versão>` e a URL da página do Confluence.
6. Trate as falhas:
   - `curl` responde `401`: a URL de envio está errada ou expirou. Volte ao item 3.
   - Outra falha: mostre o erro e o caminho do arquivo ao usuário. A página do Confluence fica como está.

*Pronto quando:* o Slack retornou o link do arquivo no canal, ou o usuário recebeu o erro e o caminho do arquivo.

## Passo 7: Relatório

Informe ao usuário: a URL da página, a página-mãe usada, o link do arquivo no Slack, as imagens não copiadas e as chaves dos chamados descartados.

*Pronto quando:* o relatório tem os 5 itens.
