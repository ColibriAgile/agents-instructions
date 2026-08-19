<#
.SYNOPSIS
    Lista as skills de bundles.yaml agrupadas por bundle, oculta as ja cobertas pelo
    skills.yaml do projeto atual, deixa escolher (fzf, se disponivel) e instala com
    `npx skills add`. A instalacao e sempre pontual; ao final, pergunta se quer
    persistir a escolha em skills.yaml (secao `sources:`) para sobreviver a reinstalacoes.

.PARAMETER Path
    Caminho do skills.yaml do projeto atual. Padrao: skills.yaml na pasta atual.

.PARAMETER BundlesPath
    Caminho local do bundles.yaml central. Padrao: bundles.yaml ao lado deste script
    (ou seja, na sua copia local clonada de agents-instructions).

.PARAMETER NoPull
    Pula o `git pull` automatico e a checagem de commit/push pendente na copia local de
    agents-instructions antes de ler bundles.yaml.

.EXAMPLE
    ./Add-Skill.ps1
#>
[CmdletBinding()]
param(
    [string]$Path = (Join-Path (Get-Location) 'skills.yaml'),
    [string]$BundlesPath = (Join-Path $PSScriptRoot 'bundles.yaml'),
    [switch]$NoPull
)

. (Join-Path $PSScriptRoot 'Skills.Common.ps1')

if (-not $NoPull) {
    Sync-BundlesRepo -BundlesPath $BundlesPath
    Assert-BundlesRepoPushed -BundlesPath $BundlesPath
}

$catalog = Get-BundlesCatalog -FilePath $BundlesPath

$manifest = $null
$installed = [System.Collections.Generic.HashSet[string]]::new()
if (Test-Path $Path) {
    $manifest = Read-ProjectManifest -FilePath $Path
    foreach ($bundleName in $manifest.Bundles) {
        if ($catalog.Bundles.Contains($bundleName)) {
            foreach ($sk in $catalog.Bundles[$bundleName]) { [void]$installed.Add($sk) }
        }
    }
    foreach ($src in $manifest.Sources) {
        foreach ($sk in $src.Skills) { [void]$installed.Add($sk) }
    }
}

$lines = [System.Collections.Generic.List[string]]::new()
foreach ($bundleName in $catalog.Bundles.Keys) {
    foreach ($sk in $catalog.Bundles[$bundleName]) {
        if (-not $installed.Contains($sk)) { $lines.Add("$bundleName / $sk") }
    }
}

if ($lines.Count -eq 0) {
    Write-Host "Todas as skills dos bundles ja estao cobertas por $Path." -ForegroundColor Green
    exit 0
}

$fzf = Get-Command fzf -ErrorAction SilentlyContinue
$selected = @()

if ($fzf) {
    $selected = @($lines | & fzf --multi --prompt="Skills disponiveis > " --header="TAB seleciona, ENTER confirma, ESC cancela")
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Cancelado." -ForegroundColor DarkGray
        exit 1
    }
}
else {
    Write-Host "Skills disponiveis (fzf nao encontrado no PATH — instale com scoop install fzf / winget install fzf):" -ForegroundColor Yellow
    $lines | ForEach-Object { Write-Host "  $_" }
    try {
        $answer = Read-Host "Skills a instalar, nomes separados por espaco (Enter para cancelar)"
    }
    catch {
        Write-Warning "Terminal nao interativo — nao da pra selecionar sem fzf."
        exit 1
    }
    if (-not $answer -or -not $answer.Trim()) {
        Write-Host "Cancelado." -ForegroundColor DarkGray
        exit 1
    }
    $wanted = $answer.Trim() -split '\s+'
    $selected = @($lines | Where-Object { $wanted -contains ($_ -split ' / ')[-1] })
}

if ($selected.Count -eq 0) {
    Write-Host "Nada selecionado." -ForegroundColor DarkGray
    exit 0
}

$chosenSkills = @($selected | ForEach-Object { ($_ -split ' / ')[-1] } | Sort-Object -Unique)

Write-Host "Instalando: $($chosenSkills -join ', ')" -ForegroundColor Cyan
$npxArgs = @('--yes', 'skills', 'add', $catalog.Repo, '-s') + $chosenSkills + @('-y')
& npx @npxArgs
if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha ao instalar: $($chosenSkills -join ', ')"
    exit 1
}
Write-Host "OK" -ForegroundColor Green

$persistAnswer = Read-Host "Adicionar ao $Path para persistir nas proximas instalacoes? (s/N)"
if ($persistAnswer -notmatch '^[sS]') {
    Write-Host "Instalacao pontual — nada gravado em $Path." -ForegroundColor DarkGray
    exit 0
}

$sourceTable = @{}
if ($manifest) {
    foreach ($src in $manifest.Sources) { Add-SkillSet -Table $sourceTable -Repo $src.Repo -Skills $src.Skills }
}
Add-SkillSet -Table $sourceTable -Repo $catalog.Repo -Skills $chosenSkills

$bundleNames = if ($manifest -and $manifest.Bundles.Count -gt 0) { $manifest.Bundles } else { @('core') }

$yamlLines = [System.Collections.Generic.List[string]]::new()
$yamlLines.Add('bundles:')
foreach ($b in $bundleNames) { $yamlLines.Add("  - $b") }
$yamlLines.Add('')
$yamlLines.Add('sources:')
foreach ($repo in $sourceTable.Keys) {
    $yamlLines.Add("  - repo: $repo")
    $yamlLines.Add('    skills:')
    foreach ($sk in ($sourceTable[$repo] | Sort-Object)) { $yamlLines.Add("      - $sk") }
}

Set-Content -Path $Path -Value $yamlLines -Encoding UTF8
Write-Host "$Path atualizado." -ForegroundColor Green
