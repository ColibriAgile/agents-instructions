<#
.SYNOPSIS
    Adiciona uma skill a um bundle em bundles.yaml, criando o bundle se ele ainda não existir. (mutating)

.PARAMETER Bundle
    Nome do bundle (lowercase, números e hífens únicos). Se não existir em bundles.yaml, é criado.

.PARAMETER Skill
    Nome da skill (deve existir como pasta em SKILLS/).

.PARAMETER Description
    Descrição de uma linha do bundle. Obrigatória apenas quando o Bundle ainda não existe.

.PARAMETER RepoRoot
    Raiz do repositório agents-instructions. Padrão: resolvida a partir deste script.

.PARAMETER BundlesPath
    Caminho do bundles.yaml. Padrão: bundles.yaml na raiz do repositório.

.EXAMPLE
    pwsh SKILLS/assign-bundles/scripts/Set-SkillBundle.ps1 -Bundle dotnet -Skill colibri-ports
.EXAMPLE
    pwsh SKILLS/assign-bundles/scripts/Set-SkillBundle.ps1 -Bundle spec-authoring -Skill breakdown-specs -Description "Quebra specs grandes em unidades menores."
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)] [string]$Bundle,
    [Parameter(Mandatory)] [string]$Skill,
    [string]$Description,
    [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')),
    [string]$BundlesPath = (Join-Path $RepoRoot 'bundles.yaml')
)

. (Join-Path $RepoRoot 'Skills.Common.ps1')

if (-not (Test-Path $BundlesPath)) {
    Write-Error "bundles.yaml não encontrado em $BundlesPath."
    exit 1
}
if (-not (Test-Path (Join-Path $RepoRoot 'SKILLS' $Skill))) {
    Write-Error "Skill '$Skill' não encontrada em $RepoRoot\SKILLS. Confira o nome (deve bater com o nome da pasta)."
    exit 1
}

$lines = [System.Collections.Generic.List[string]](Get-Content -Path $BundlesPath)

$headerPattern = "^  $([regex]::Escape($Bundle)):\s*$"
$headerIndex = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match $headerPattern) { $headerIndex = $i; break }
}

if ($headerIndex -eq -1) {
    if (-not $Description) {
        Write-Error "Bundle '$Bundle' não existe em bundles.yaml. Informe -Description para criá-lo."
        exit 1
    }
    if ($Bundle -notmatch '^[a-z0-9]+(-[a-z0-9]+)*$') {
        Write-Error "Nome de bundle inválido: '$Bundle'. Use lowercase, números e hífens únicos."
        exit 1
    }

    while ($lines.Count -gt 0 -and $lines[$lines.Count - 1].Trim() -eq '') {
        $lines.RemoveAt($lines.Count - 1)
    }
    $lines.Add('')
    $lines.Add("  ${Bundle}:")
    $lines.Add("    description: $Description")
    $lines.Add('    skills:')
    $lines.Add("      - $Skill")

    Set-Content -Path $BundlesPath -Value $lines -Encoding UTF8
    Write-Host "Bundle '$Bundle' criado com a skill '$Skill'." -ForegroundColor Green
    exit 0
}

# Bundle existente: delimita a região até o próximo bundle (indentação de 2 espaços) ou EOF.
$nextHeaderIndex = $lines.Count
for ($i = $headerIndex + 1; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^  [\w-]+:\s*$') { $nextHeaderIndex = $i; break }
}

$skillsIndex = -1
for ($i = $headerIndex + 1; $i -lt $nextHeaderIndex; $i++) {
    if ($lines[$i] -match '^\s*skills:\s*$') { $skillsIndex = $i; break }
}
if ($skillsIndex -eq -1) {
    Write-Error "Bundle '$Bundle' não tem uma seção 'skills:' reconhecível em bundles.yaml. Corrija o arquivo manualmente."
    exit 1
}

$lastEntryIndex = $skillsIndex
$existing = $false
$existingSkills = [System.Collections.Generic.List[string]]::new()
for ($i = $skillsIndex + 1; $i -lt $nextHeaderIndex; $i++) {
    if ($lines[$i] -notmatch '^\s*-\s*(.+?)\s*$') { break }
    $lastEntryIndex = $i
    $name = $matches[1].Trim('"''')
    if ($name -eq $Skill) { $existing = $true }
    $existingSkills.Add($name)
}

if ($existing) {
    Write-Host "Skill '$Skill' já está no bundle '$Bundle'." -ForegroundColor Yellow
    exit 0
}

$existingSkills.Add($Skill)
$sortedSkills = $existingSkills | Sort-Object

$lines.RemoveRange($skillsIndex + 1, $lastEntryIndex - $skillsIndex)
$insertIndex = $skillsIndex + 1
foreach ($name in $sortedSkills) {
    $lines.Insert($insertIndex, "      - $name")
    $insertIndex++
}

Set-Content -Path $BundlesPath -Value $lines -Encoding UTF8
Write-Host "Skill '$Skill' adicionada ao bundle '$Bundle' (lista ordenada alfabeticamente)." -ForegroundColor Green
