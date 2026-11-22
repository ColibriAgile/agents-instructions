#Requires -Version 7
<#
.SYNOPSIS
  Envia imagens ao Atlassian Media com o token da fase 1 do uploadAttachmentToJiraIssue.

.DESCRIPTION
  A fase 1 do uploadAttachmentToJiraIssue devolve um uploadCommand (curl). Desse comando, tire:
    - o token do cabeçalho "Authorization: Bearer <token>";
    - o parâmetro "collection" da URL;
    - o cabeçalho "X-Client-Id".
  O mesmo token envia vários arquivos enquanto não expira (cerca de 20 minutos).
  O script mostra 1 linha por arquivo: "<nome do arquivo><TAB><fileId>". Ele nunca mostra o token.

.EXAMPLE
  $env:ATLASSIAN_MEDIA_TOKEN = '<token>'
  ./enviar-imagens.ps1 -Collection upload-user-collection-123 -ClientId <id> -Arquivos (Get-ChildItem png/*.png | Sort-Object Name)
#>
param(
    [Parameter(Mandatory)] [string] $Collection,
    [Parameter(Mandatory)] [string] $ClientId,
    [Parameter(Mandatory)] [System.IO.FileInfo[]] $Arquivos,
    # O token vem da variável de ambiente para não ficar no histórico do shell.
    [string] $Token = $env:ATLASSIAN_MEDIA_TOKEN
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($Token)) {
    throw 'Informe o token em $env:ATLASSIAN_MEDIA_TOKEN ou no parâmetro -Token.'
}

$cabecalhos = @{
    Authorization = "Bearer $Token"
    Accept        = 'application/json'
    'X-Client-Id' = $ClientId
}

foreach ($arquivo in $Arquivos) {
    $nome = [uri]::EscapeDataString($arquivo.Name)
    $url = "https://api.media.atlassian.com/file/binary?collection=$Collection&name=$nome"

    try {
        $resposta = Invoke-RestMethod -Method Post -Uri $url -Headers $cabecalhos -InFile $arquivo.FullName -ContentType 'application/octet-stream'
    }
    catch {
        # Um 401 quer dizer token expirado: peça outro token na fase 1 e envie só os arquivos que faltam.
        Write-Error "Falha no envio de $($arquivo.Name): $($_.Exception.Message)"
        continue
    }

    "{0}`t{1}" -f $arquivo.Name, $resposta.data.id
}
