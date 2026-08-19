<#
.SYNOPSIS
    Lista as skills em SKILLS/ que não pertencem a nenhum bundle de bundles.yaml. (read-only)

.PARAMETER RepoRoot
    Raiz do repositório agents-instructions. Padrão: resolvida a partir deste script (SKILLS/bundle-orphan-skills/scripts/../../..).

.PARAMETER SkillsPath
    Caminho da pasta SKILLS. Padrão: SKILLS na raiz do repositório.

.PARAMETER BundlesPath
    Caminho do bundles.yaml. Padrão: bundles.yaml na raiz do repositório.

.EXAMPLE
    pwsh SKILLS/bundle-orphan-skills/scripts/Find-OrphanSkills.ps1
#>
[CmdletBinding()]
param(
    [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')),
    [string]$SkillsPath = (Join-Path $RepoRoot 'SKILLS'),
    [string]$BundlesPath = (Join-Path $RepoRoot 'bundles.yaml')
)

. (Join-Path $RepoRoot 'Skills.Common.ps1')

$catalog = Get-BundlesCatalog -FilePath $BundlesPath
$bundled = [System.Collections.Generic.HashSet[string]]::new()
foreach ($skills in $catalog.Bundles.Values) {
    foreach ($s in $skills) { [void]$bundled.Add($s) }
}

$allSkills = Get-ChildItem -Path $SkillsPath -Directory | Where-Object { $_.Name -notlike '.*' } | Select-Object -ExpandProperty Name

$orphans = @($allSkills | Where-Object { -not $bundled.Contains($_) } | Sort-Object)

if ($orphans.Count -eq 0) {
    Write-Host "Todas as skills pertencem a pelo menos 1 bundle." -ForegroundColor Green
    exit 0
}

Write-Host "Skills sem bundle ($($orphans.Count)):" -ForegroundColor Yellow
$orphans | ForEach-Object { Write-Host "  - $_" }
