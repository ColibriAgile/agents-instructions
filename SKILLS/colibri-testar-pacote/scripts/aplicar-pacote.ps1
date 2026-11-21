# Envia um .cmpkg (ou um .zip de .cmpkg) ao Colibri Master, aplica cada pacote importado
# e espera o fim da aplicação. Sem perguntas: serve para agentes.
#
# Com -Conferir, só confere se o Master responde (read-only).
#
# Saída: 1 linha por pacote no stdout ("<nome> <versao>: <estado>").
# Código de saída: 0 = todos os pacotes completos (ou Master no ar, com -Conferir);
# 1 = erro no envio ou na aplicação; 2 = Master fora do ar; 3 = tempo de espera esgotado.
[CmdletBinding()]
param(
    [string]$Arquivo,
    [switch]$Conferir,
    [string]$MasterUrl = 'http://localhost:4000',
    [int]$TimeoutMinutos = 20,
    [int]$IntervaloSegundos = 5
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

if ($PSVersionTable.PSVersion.Major -lt 7) {
    [Console]::Error.WriteLine('Use o PowerShell 7 (pwsh): o envio multipart precisa de Invoke-RestMethod -Form.')
    exit 1
}

if (-not $Conferir -and -not ($Arquivo -and (Test-Path -LiteralPath $Arquivo -PathType Leaf))) {
    [Console]::Error.WriteLine("Arquivo não encontrado: '$Arquivo'. Informe -Arquivo ou use -Conferir.")
    exit 1
}

$api = $MasterUrl.TrimEnd('/') + '/api/pacotes/'

function Invoke-Master {
    param([string]$Metodo, [string]$Uri, [hashtable]$Form)

    $params = @{
        Uri                = $Uri
        Method             = $Metodo
        SkipHttpErrorCheck = $true
        StatusCodeVariable = 'codigo'
    }

    if ($Form) {
        $params.Form = $Form
    }

    $resposta = Invoke-RestMethod @params
    [PSCustomObject]@{ Codigo = [int]$codigo; Corpo = $resposta }
}

function Escrever-Erro {
    param([string]$Etapa, $Resposta)

    $status = $Resposta.Corpo.status
    $texto = if ($status) { $status | ConvertTo-Json -Depth 6 -Compress } else { "$($Resposta.Corpo)" }
    [Console]::Error.WriteLine("$Etapa falhou (HTTP $($Resposta.Codigo)): $texto")
}

# 1. Master no ar
try {
    $conferencia = Invoke-Master -Metodo Get -Uri $api
}
catch {
    [Console]::Error.WriteLine("O Master não responde em $api : $($_.Exception.Message)")
    exit 2
}

if ($conferencia.Codigo -ne 200) {
    Escrever-Erro -Etapa 'Conferência do Master' -Resposta $conferencia
    exit 2
}

if ($Conferir) {
    Write-Output "Master no ar: $api"
    exit 0
}

# 2. Envio
$envio = Invoke-Master -Metodo Post -Uri $api -Form @{ file = Get-Item -LiteralPath $Arquivo }

if ($envio.Codigo -ne 200) {
    Escrever-Erro -Etapa 'Envio' -Resposta $envio
    exit 1
}

# Um .cmpkg devolve o pacote em 'dados'; um .zip devolve 'dados.pacotes' e 'dados.falhas'.
$dados = $envio.Corpo.dados
$importados = if ($null -ne $dados.pacotes) { @($dados.pacotes) } else { @($dados) }
$falhou = $false

foreach ($falha in @($dados.falhas | Where-Object { $_ })) {
    [Console]::Error.WriteLine("Importação falhou: $($falha.arquivo): $($falha.erro)")
    $falhou = $true
}

# 3. Aplicação
$aguardar = @()

foreach ($p in $importados) {
    if ($p.estado -eq 'completo') {
        Write-Output "$($p.nome) $($p.versao): completo (já estava aplicado)"
        continue
    }

    $aplicacao = Invoke-Master -Metodo Put -Uri "$api$($p.nome)/$($p.versao)/"

    if ($aplicacao.Codigo -ne 200) {
        Escrever-Erro -Etapa "Aplicação de $($p.nome) $($p.versao)" -Resposta $aplicacao
        $falhou = $true
        continue
    }

    $aguardar += $p
}

# 4. Espera. Um pacote do próprio Master reinicia o serviço: falha de conexão aqui não é erro.
$limite = (Get-Date).AddMinutes($TimeoutMinutos)

while ($aguardar.Count -gt 0) {
    if ((Get-Date) -gt $limite) {
        foreach ($p in $aguardar) {
            [Console]::Error.WriteLine("$($p.nome) $($p.versao): tempo de espera esgotado ($TimeoutMinutos min)")
        }
        exit 3
    }

    Start-Sleep -Seconds $IntervaloSegundos

    try {
        $lista = (Invoke-Master -Metodo Get -Uri $api).Corpo.dados
    }
    catch {
        continue
    }

    $pendentes = @()

    foreach ($p in $aguardar) {
        $atual = @($lista | Where-Object { $_.nome -eq $p.nome -and $_.versao -eq $p.versao }) | Select-Object -First 1

        switch ($atual.estado) {
            'completo' {
                Write-Output "$($p.nome) $($p.versao): completo"
            }
            'erro' {
                Write-Output "$($p.nome) $($p.versao): erro"
                [Console]::Error.WriteLine("$($p.nome) $($p.versao): $($atual.mensagem)")

                if ($atual.arquivo_log) {
                    [Console]::Error.WriteLine("  log do pacote: $($atual.arquivo_log)")
                }

                foreach ($a in @($atual.arquivos | Where-Object { $_.estado -eq 'erro' })) {
                    [Console]::Error.WriteLine("  arquivo $($a.nome) ($($a.destino)) log: $($a.arquivo_log)")
                }

                $falhou = $true
            }
            default {
                $pendentes += $p
            }
        }
    }

    $aguardar = $pendentes
}

if ($falhou) {
    exit 1
}

exit 0
