<#
.SYNOPSIS
    Inicializa skills.yaml na pasta atual: escolhe bundles via fzf (core é sempre
    incluído), grava o manifesto e garante o bloco de artefatos no .gitignore.
    Não instala nada — rode Install-Skills.ps1 depois (ou deixe ele chamar isso sozinho
    quando não achar skills.yaml).

.PARAMETER BundlesPath
    Caminho local do bundles.yaml central. Padrão: bundles.yaml ao lado deste script.

.EXAMPLE
    ./Init-Skills.ps1
#>
[CmdletBinding()]
param(
    [string]$BundlesPath = (Join-Path $PSScriptRoot 'bundles.yaml'),
    [switch]$NoPull
)

. (Join-Path $PSScriptRoot 'Skills.Common.ps1')

if (-not $NoPull) {
    Sync-BundlesRepo -BundlesPath $BundlesPath
    Assert-BundlesRepoPushed -BundlesPath $BundlesPath
}

if (-not (Get-Command fzf -ErrorAction SilentlyContinue)) {
    Write-Error "fzf não encontrado no PATH. Instale (scoop install fzf / winget install fzf) e tente de novo."
    exit 1
}

$catalog = Get-BundlesCatalog -FilePath $BundlesPath
$pickable = $catalog.Bundles.Keys | Where-Object { $_ -ne 'core' }

if (-not $pickable) {
    Write-Error "Nenhum bundle além de 'core' encontrado em $BundlesPath."
    exit 1
}

$projectPath = (Get-Location).Path
$skillsYamlPath = Join-Path $projectPath 'skills.yaml'
$existingBundles = @()

if (Test-Path $skillsYamlPath) {
    $existingBundles = (Read-ProjectManifest -FilePath $skillsYamlPath).Bundles
    Write-Host "skills.yaml já existe. Bundles atuais: $($existingBundles -join ', ')" -ForegroundColor Yellow
}

$fzfLines = $pickable | ForEach-Object {
    $marker = if ($existingBundles -contains $_) { '[já incluído] ' } else { '' }
    "{0} — {1}{2}" -f $_, $marker, $catalog.Descriptions[$_]
}

$selected = $fzfLines | fzf --multi `
    --prompt="Bundles (core sempre incluído) > " `
    --header="TAB seleciona, ENTER confirma, ESC cancela"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Cancelado." -ForegroundColor DarkGray
    exit 1
}

$chosenBundles = @('core') + @($selected | ForEach-Object { ($_ -split '\s+')[0] } | Sort-Object -Unique)

if (Test-Path $skillsYamlPath) {
    $answer = Read-Host "Sobrescrever $skillsYamlPath com [$($chosenBundles -join ', ')]? (s/N)"
    if ($answer -notmatch '^[sS]') {
        Write-Host "Cancelado."
        exit 1
    }
}

$yamlLines = @('bundles:') + ($chosenBundles | ForEach-Object { "  - $_" })
Set-Content -Path $skillsYamlPath -Value $yamlLines -Encoding UTF8
Write-Host "skills.yaml criado com bundles: $($chosenBundles -join ', ')" -ForegroundColor Green

if (Set-SkillsGitignore -ProjectPath $projectPath) {
    Write-Host ".gitignore atualizado com os artefatos de skills." -ForegroundColor Green
}
else {
    Write-Host ".gitignore já tinha o bloco de skills — nada a fazer." -ForegroundColor DarkGray
}
