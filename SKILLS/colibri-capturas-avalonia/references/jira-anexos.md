# Imagens num comentário do Jira

Este arquivo mostra como pôr várias imagens num comentário do Jira com o MCP do Atlassian, sem anexos duplicados.

## Regras

| Regra | Motivo |
|---|---|
| Faça a fase 1 do `uploadAttachmentToJiraIssue` só 1 vez | O token da resposta envia vários arquivos durante cerca de 20 minutos (`exp` − `nbf` do JWT). |
| Envie com `scripts/enviar-imagens.ps1` | Um `curl` por arquivo repete o mesmo comando. O script envia a lista e devolve os `fileId`. |
| Use `inlineFileId` no `addOrEditJiraIssueComment` | Uma imagem dentro do comentário já fica anexada à tarefa. |
| Não faça a fase 2 para uma imagem do comentário | A fase 2 cria um 2º anexo do mesmo arquivo. |
| No máximo 20 imagens por comentário | O MCP recusa mais de 20 itens em `inlineFileId`. |
| Não mostre o token | O token dá acesso de escrita à coleção do usuário. Ele não entra no relatório, em commits nem em comentários. |

## Passos

1. Chame `executeWrite` com `name: "uploadAttachmentToJiraIssue"` e `inputs: { issueIdOrKey, filePath }`. O `filePath` é a 1ª imagem. A fase 1 não lê o arquivo: ela só gera o token e o comando, e não anexa nada à tarefa.
2. Do `uploadCommand` da resposta, tire o token (`Authorization: Bearer ...`), a `collection` e o `X-Client-Id`.
3. Envie as imagens, em ordem de nome:

   ```powershell
   $env:ATLASSIAN_MEDIA_TOKEN = '<token>'
   ./scripts/enviar-imagens.ps1 -Collection <collection> -ClientId <X-Client-Id> -Arquivos (Get-ChildItem <pasta>/*.png | Sort-Object Name)
   ```

   Se uma linha sai com erro 401, o token expirou. Faça a fase 1 de novo e envie só os arquivos que faltam.
4. Monte o comentário em HTML:
   - uma menção, quando o usuário pediu (o método do `accountId` está no passo 6 de `../colibri-para-teste/SKILL.md`);
   - o motivo das imagens e o pacote ou commit que elas mostram;
   - uma lista que explica cada número de arquivo. As imagens ficam no fim do comentário, na ordem de `inlineFileId`;
   - os limites do headless, por exemplo "o fundo semitransparente sai sobre preto".
5. Publique com `addOrEditJiraIssueComment`:
   - `contentFormat: "html"`;
   - `inlineFileId`: os `fileId`, na ordem de nome;
   - `inlineFileCollection`: 1 item com a `collection` (1 valor vale para todos);
   - `inlineFileName`: os nomes dos arquivos, na mesma ordem.
6. Com mais de 20 imagens, divida por tela e não no meio de um par claro/escuro. O 1º comentário tem o texto completo e diz que as outras imagens estão no comentário seguinte. Os outros comentários têm 1 linha de legenda.

*Pronto quando:* cada `addOrEditJiraIssueComment` devolve `inlineMediaEmbedded: true`, e a soma de `inlineMediaCount` é igual ao número de imagens.
