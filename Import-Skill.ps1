<#
.SYNOPSIS
    Baixa uma ou mais skills de um repositorio externo (formato aceito por `npx skills add`,
    ex: owner/repo) direto para SKILLS/ deste repositorio, sem deixar rastro em outro lugar
    (roda em pasta temporaria isolada, apaga tudo ao final).

.PARAMETER Source
    Repositorio de origem das skills (ex: vercel-labs/agent-skills).

.PARAMETER Skills
    Nome(s) da(s) skill(s) a baixar do Source. Use `npx skills add <Source> -l` para listar.

.PARAMETER Force
    Sobrescreve a pasta em SKILLS/<skill> se ela ja existir.

.PARAMETER RepoRoot
    Raiz deste repositorio. Padrao: resolvida a partir deste script.

.EXAMPLE
    ./Import-Skill.ps1 -Source vercel-labs/agent-skills -Skills deploy-to-vercel
.EXAMPLE
    ./Import-Skill.ps1 -Source owner/repo -Skills skill-a, skill-b -Force
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)] [string]$Source,
    [Parameter(Mandatory)] [string[]]$Skills,
    [switch]$Force,
    [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '.'))
)

$skillsRoot = Join-Path $RepoRoot 'SKILLS'
if (-not (Test-Path $skillsRoot)) {
    Write-Error "SKILLS/ nao encontrado em $RepoRoot. Rode a partir da raiz do repositorio agents-instructions."
    exit 1
}

$targets = @{}
foreach ($skill in $Skills) {
    $dest = Join-Path $skillsRoot $skill
    if ((Test-Path $dest) -and -not $Force) {
        Write-Error "SKILLS/$skill ja existe. Use -Force para sobrescrever."
        exit 1
    }
    $targets[$skill] = $dest
}

$tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "import-skill-$([guid]::NewGuid().ToString('N'))"
New-Item -ItemType Directory -Path $tempDir | Out-Null

try {
    Push-Location $tempDir
    $npxArgs = @('--yes', 'skills', 'add', $Source, '-s') + $Skills + @('--copy', '-a', 'claude-code', '-y')
    & npx @npxArgs
    $installExit = $LASTEXITCODE
    Pop-Location

    if ($installExit -ne 0) {
        Write-Error "Falha ao baixar de '$Source': $($Skills -join ', ')"
        exit 1
    }

    $copiedRoot = Join-Path $tempDir '.claude\skills'
    foreach ($skill in $Skills) {
        $copied = Join-Path $copiedRoot $skill
        if (-not (Test-Path $copied)) {
            Write-Error "Skill '$skill' nao encontrada em '$Source' (confira o nome com: npx skills add $Source -l)."
            exit 1
        }
    }

    foreach ($skill in $Skills) {
        $dest = $targets[$skill]
        if (Test-Path $dest) { Remove-Item -Path $dest -Recurse -Force }
        Move-Item -Path (Join-Path $copiedRoot $skill) -Destination $dest
        Write-Host "SKILLS/$skill <- $Source" -ForegroundColor Green
    }
}
finally {
    if ((Get-Location).Path -eq $tempDir) { Pop-Location }
    Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Proximo passo — adicionar a um bundle:" -ForegroundColor Cyan
foreach ($skill in $Skills) {
    Write-Host "  pwsh SKILLS/bundle-orphan-skills/scripts/Set-SkillBundle.ps1 -Bundle <bundle> -Skill $skill"
}
