<#
.SYNOPSIS
    Instala ou atualiza skills de agentes de IA a partir de skills.yaml usando `npx skills`.

.PARAMETER Path
    Caminho do arquivo skills.yaml. Padrão: skills.yaml na pasta atual.

.PARAMETER Silent
    Modo silencioso: só imprime avisos, erros e o resumo final.

.PARAMETER Detailed
    Mostra a saída completa e em tempo real do `npx skills add` para cada fonte.

.EXAMPLE
    ./Install-Skills.ps1
    ./Install-Skills.ps1 -Silent
    ./Install-Skills.ps1 -Detailed
#>
[CmdletBinding()]
param(
    [string]$Path = (Join-Path (Get-Location) 'skills.yaml'),
    [switch]$Silent,
    [switch]$Detailed
)

if ($Silent -and $Detailed) {
    Write-Error "Use apenas uma das opções: -Silent ou -Detailed."
    exit 1
}

if (-not (Test-Path $Path)) {
    Write-Error "Arquivo não encontrado: $Path"
    exit 1
}

function Read-SkillsYaml {
    param([string]$FilePath)

    $sources = @()
    $current = $null
    $inSkills = $false

    foreach ($rawLine in Get-Content -Path $FilePath) {
        $line = $rawLine -replace '#.*$', ''
        if ($line.Trim() -eq '') { continue }

        if ($line -match '^\s*-\s*repo:\s*(.+?)\s*$') {
            if ($current) { $sources += $current }
            $current = [pscustomobject]@{ Repo = ($matches[1].Trim('"''')); Skills = @() }
            $inSkills = $false
            continue
        }
        if ($line -match '^\s*skills:\s*$') {
            $inSkills = $true
            continue
        }
        if ($inSkills -and $line -match '^\s*-\s*(.+?)\s*$') {
            $current.Skills += $matches[1].Trim('"''')
            continue
        }
    }
    if ($current) { $sources += $current }
    return $sources
}

$sources = Read-SkillsYaml -FilePath $Path | Where-Object { $_.Skills.Count -gt 0 }

if (-not $sources -or $sources.Count -eq 0) {
    Write-Error "Nenhuma fonte com skills encontrada em $Path"
    exit 1
}

$failed = @()
$i = 0

foreach ($source in $sources) {
    $i++
    if (-not $Silent) {
        Write-Host "[$i/$($sources.Count)] $($source.Repo): $($source.Skills -join ', ')" -ForegroundColor Cyan
    }

    $npxArgs = @('--yes', 'skills', 'add', $source.Repo, '-s') + $source.Skills + @('-y')

    if ($Detailed) {
        & npx @npxArgs
        $exitCode = $LASTEXITCODE
    }
    else {
        $output = & npx @npxArgs 2>&1
        $exitCode = $LASTEXITCODE
        if ($exitCode -ne 0) { $output | Out-Host }
    }

    if ($exitCode -ne 0) {
        $failed += $source.Repo
        Write-Warning "Falha ao instalar/atualizar skills de $($source.Repo)"
    }
    elseif (-not $Silent) {
        Write-Host "  OK" -ForegroundColor Green
    }
}

if (-not $Silent) {
    Write-Host ""
    Write-Host "Concluído: $($sources.Count - $failed.Count)/$($sources.Count) fontes processadas com sucesso."
}

if ($failed.Count -gt 0) {
    Write-Error "Falhas em: $($failed -join ', ')"
    exit 1
}
