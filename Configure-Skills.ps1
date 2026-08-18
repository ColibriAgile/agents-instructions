<#
.SYNOPSIS
    Reconfigura os bundles do skills.yaml existente na pasta atual: mostra os bundles
    já configurados, lista os disponíveis em bundles.yaml (com descrição) via fzf com
    seleção múltipla pré-marcada nos já presentes, e regrava skills.yaml com a escolha.
    'core' é sempre mantido. A seção `sources:` (fontes ad hoc), se existir, é preservada.

.PARAMETER Path
    Caminho do skills.yaml a reconfigurar. Padrão: skills.yaml na pasta atual.

.PARAMETER BundlesPath
    Caminho local do bundles.yaml central. Padrão: bundles.yaml ao lado deste script.

.EXAMPLE
    ./Configure-Skills.ps1
#>
[CmdletBinding()]
param(
    [string]$Path = (Join-Path (Get-Location) 'skills.yaml'),
    [string]$BundlesPath = (Join-Path $PSScriptRoot 'bundles.yaml')
)

. (Join-Path $PSScriptRoot 'Skills.Common.ps1')

if (-not (Get-Command fzf -ErrorAction SilentlyContinue)) {
    Write-Error "fzf não encontrado no PATH. Instale (scoop install fzf / winget install fzf) e tente de novo."
    exit 1
}

if (-not (Test-Path $Path)) {
    Write-Error "$Path não encontrado. Rode Init-Skills.ps1 primeiro para criar o skills.yaml."
    exit 1
}

$catalog = Get-BundlesCatalog -FilePath $BundlesPath
$pickable = @($catalog.Bundles.Keys | Where-Object { $_ -ne 'core' })

if (-not $pickable) {
    Write-Error "Nenhum bundle além de 'core' encontrado em $BundlesPath."
    exit 1
}

$manifest = Read-ProjectManifest -FilePath $Path
$existingBundles = @($manifest.Bundles)

Write-Host "Bundles configurados hoje em $Path : $($existingBundles -join ', ')" -ForegroundColor Yellow

$fzfLines = $pickable | ForEach-Object { "{0} — {1}" -f $_, $catalog.Descriptions[$_] }

$preselectBinds = for ($i = 0; $i -lt $pickable.Count; $i++) {
    if ($existingBundles -contains $pickable[$i]) { "pos($($i + 1))+toggle" }
}
$startBind = 'load:' + (@($preselectBinds) -join '+')

$fzfArgs = @(
    '--multi'
    '--prompt=Bundles (core sempre incluído) > '
    '--header=TAB seleciona/deseleciona, ENTER confirma, ESC cancela'
)
if ($preselectBinds) { $fzfArgs += @('--bind', $startBind) }

$selected = $fzfLines | & fzf @fzfArgs

if ($LASTEXITCODE -ne 0) {
    Write-Host "Cancelado." -ForegroundColor DarkGray
    exit 1
}

$chosenBundles = @('core') + @($selected | ForEach-Object { ($_ -split '\s+')[0] } | Sort-Object -Unique)

$added = @($chosenBundles | Where-Object { $_ -ne 'core' -and $existingBundles -notcontains $_ })
$removed = @($existingBundles | Where-Object { $chosenBundles -notcontains $_ })

$yamlLines = @('bundles:') + ($chosenBundles | ForEach-Object { "  - $_" })
if ($manifest.Sources.Count -gt 0) {
    $yamlLines += ''
    $yamlLines += 'sources:'
    foreach ($src in $manifest.Sources) {
        $yamlLines += "  - repo: $($src.Repo)"
        $yamlLines += '    skills:'
        $yamlLines += ($src.Skills | ForEach-Object { "      - $_" })
    }
}

Set-Content -Path $Path -Value $yamlLines -Encoding UTF8

Write-Host "skills.yaml atualizado com bundles: $($chosenBundles -join ', ')" -ForegroundColor Green
if ($added.Count -gt 0) { Write-Host "  + adicionados: $($added -join ', ')" -ForegroundColor Green }
if ($removed.Count -gt 0) { Write-Host "  - removidos: $($removed -join ', ')" -ForegroundColor DarkYellow }
Write-Host "Rode Install-Skills.ps1 para aplicar." -ForegroundColor Cyan
