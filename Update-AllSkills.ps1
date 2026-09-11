<#
.SYNOPSIS
    Atualiza as skills de todos os projetos sob uma pasta base, chamando Install-Skills.ps1
    em cada pasta que contenha skills.yaml.

.DESCRIPTION
    Descobre os projetos, sincroniza a cópia local de agents-instructions uma única vez
    (git pull + verificação de commit/push pendente) e então roda Install-Skills.ps1 em cada
    projeto com -NoPull, evitando repetir a sincronização N vezes.

    Cada projeto é processado no seu próprio diretório, porque `npx skills add` instala no
    diretório atual. Falha em um projeto não interrompe os demais: o resumo final lista
    todos e o script sai com código 1 se algum falhou.

.PARAMETER Root
    Pasta base onde procurar projetos. Padrão: a pasta que contém este repositório.

.PARAMETER Depth
    Profundidade máxima da busca por skills.yaml a partir de Root. Padrão: 3.

.PARAMETER Exclude
    Padrões wildcard de caminho a ignorar (ex: '*\legado\*', '*sandbox*').

.PARAMETER ListOnly
    Apenas lista os projetos que seriam atualizados e sai, sem instalar nada.

.PARAMETER Silent
    Imprime somente o resumo final. Sem esta opção, imprime uma linha por projeto.

.PARAMETER Detailed
    Repassa -Detailed ao Install-Skills.ps1, mostrando a saída completa de cada fonte.

.PARAMETER NoReconcile
    Repassa -NoReconcile ao Install-Skills.ps1, pulando a detecção de skills fora do manifesto.

.PARAMETER NoPull
    Pula a sincronização inicial da cópia local de agents-instructions.

.PARAMETER BundlesPath
    Caminho do bundles.yaml central. Padrão: bundles.yaml ao lado deste script.

.EXAMPLE
    ./Update-AllSkills.ps1 -ListOnly
    ./Update-AllSkills.ps1
    ./Update-AllSkills.ps1 -Root D:\Projetos -Exclude '*\arquivados\*'
    ./Update-AllSkills.ps1 -Silent
#>
[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string]$Root = (Split-Path -Parent $PSScriptRoot),
    [int]$Depth = 3,
    [string[]]$Exclude = @(),
    [switch]$ListOnly,
    [switch]$Silent,
    [switch]$Detailed,
    [switch]$NoReconcile,
    [switch]$NoPull,
    [string]$BundlesPath = (Join-Path $PSScriptRoot 'bundles.yaml')
)

if ($Silent -and $Detailed) {
    Write-Error "Use apenas uma das opções: -Silent ou -Detailed."
    exit 1
}

if (-not (Test-Path -LiteralPath $Root -PathType Container)) {
    Write-Error "Pasta base não encontrada: $Root"
    exit 1
}

$installScript = Join-Path $PSScriptRoot 'Install-Skills.ps1'
if (-not (Test-Path -LiteralPath $installScript)) {
    Write-Error "Install-Skills.ps1 não encontrado em $PSScriptRoot"
    exit 1
}

$Root = (Resolve-Path -LiteralPath $Root).Path

# ---------- descoberta ----------

function Find-Manifests {
    param([string]$Base, [int]$MaxDepth)

    $skip = @('node_modules', '.git', 'bin', 'obj', 'dist', 'packages', '.vs')

    if (Get-Command rg -ErrorAction SilentlyContinue) {
        $globs = @('-g', 'skills.yaml')
        foreach ($d in $skip) { $globs += @('-g', "!**/$d/**") }
        $found = & rg --files --no-ignore --hidden --max-depth $MaxDepth @globs -- $Base 2>$null
        if ($LASTEXITCODE -le 1) { return @($found) }
    }

    # Fallback sem ripgrep.
    return @(
        Get-ChildItem -LiteralPath $Base -Filter 'skills.yaml' -File -Recurse -Depth $MaxDepth -ErrorAction SilentlyContinue |
            Where-Object { $p = $_.FullName; -not ($skip | Where-Object { $p -like "*\$_\*" }) } |
            ForEach-Object { $_.FullName }
    )
}

$manifests = Find-Manifests -Base $Root -MaxDepth $Depth

if ($Exclude.Count -gt 0) {
    $manifests = @($manifests | Where-Object {
        $path = $_
        -not ($Exclude | Where-Object { $path -like $_ })
    })
}

$projects = @(
    $manifests |
        ForEach-Object { Split-Path -Parent $_ } |
        Sort-Object -Unique
)

if ($projects.Count -eq 0) {
    Write-Warning "Nenhum skills.yaml encontrado sob $Root (profundidade $Depth)."
    exit 0
}

if ($ListOnly) {
    Write-Host ""
    Write-Host "$($projects.Count) projeto(s) sob $Root" -ForegroundColor Cyan
    $projects | ForEach-Object { Write-Host "  $_" }
    exit 0
}

# ---------- sincronização única do catálogo ----------

if (-not $NoPull) {
    . (Join-Path $PSScriptRoot 'Skills.Common.ps1')
    Sync-BundlesRepo -BundlesPath $BundlesPath -Quiet:$Silent
    Assert-BundlesRepoPushed -BundlesPath $BundlesPath
}

# ---------- execução ----------

# Splatting de hashtable: array passaria '-Silent' como argumento posicional, não como switch.
$childArgs = @{ NoPull = $true }
if ($Detailed) { $childArgs['Detailed'] = $true } else { $childArgs['Silent'] = $true }
if ($NoReconcile) { $childArgs['NoReconcile'] = $true }

$results = [System.Collections.Generic.List[object]]::new()
$total = $projects.Count
$i = 0
$sw = [System.Diagnostics.Stopwatch]::StartNew()

if (-not $Silent) {
    Write-Host ""
    Write-Host "Atualizando skills em $total projeto(s) sob $Root..." -ForegroundColor Cyan
    Write-Host ""
}

foreach ($project in $projects) {
    $i++
    $name = Split-Path -Leaf $project

    if (-not $Silent) {
        Write-Progress -Activity "Atualizando skills" -Status "[$i/$total] $name" -PercentComplete (100 * ($i - 1) / $total)
        Write-Host ("  [{0,2}/{1}] " -f $i, $total) -ForegroundColor DarkGray -NoNewline
        Write-Host $name.PadRight(28) -ForegroundColor White -NoNewline
    }

    $itemSw = [System.Diagnostics.Stopwatch]::StartNew()
    Push-Location -LiteralPath $project
    try {
        & $installScript -Path (Join-Path $project 'skills.yaml') @childArgs
        $exitCode = $LASTEXITCODE
    }
    catch {
        $exitCode = 1
        Write-Warning "Erro inesperado em ${project}: $_"
    }
    finally {
        Pop-Location
    }
    $itemSw.Stop()

    $ok = ($exitCode -eq 0)
    $results.Add([pscustomobject]@{
        Projeto  = $name
        Caminho  = $project
        Ok       = $ok
        Segundos = [math]::Round($itemSw.Elapsed.TotalSeconds, 1)
    })

    if (-not $Silent) {
        if ($ok) { Write-Host "OK" -ForegroundColor Green -NoNewline }
        else { Write-Host "FALHA" -ForegroundColor Red -NoNewline }
        Write-Host (" ({0:n1}s)" -f $itemSw.Elapsed.TotalSeconds) -ForegroundColor DarkGray
    }
}

$sw.Stop()
if (-not $Silent) { Write-Progress -Activity "Atualizando skills" -Completed }

# ---------- resumo ----------

$failed = @($results | Where-Object { -not $_.Ok })
$okCount = $total - $failed.Count

Write-Host ""
Write-Host "Concluído: " -NoNewline
Write-Host "$okCount/$total projeto(s)" -ForegroundColor $(if ($failed.Count -gt 0) { 'Yellow' } else { 'Green' }) -NoNewline
Write-Host (" · {0:n1}s" -f $sw.Elapsed.TotalSeconds) -ForegroundColor DarkGray

if ($failed.Count -gt 0) {
    Write-Host ""
    Write-Host "Falharam:" -ForegroundColor Red
    $failed | ForEach-Object { Write-Host "  - $($_.Projeto)  ($($_.Caminho))" }
    Write-Host ""
    Write-Host "Rode novamente só no projeto afetado para ver o erro:" -ForegroundColor DarkGray
    Write-Host "  cd '$($failed[0].Caminho)'; & '$installScript' -Detailed" -ForegroundColor DarkGray
    exit 1
}
