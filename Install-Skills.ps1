<#
.SYNOPSIS
    Instala/atualiza skills de agentes de IA a partir de skills.yaml (bundles + sources)
    usando `npx skills`, e reconcilia skills instaladas que não pertencem ao manifesto.
    Se skills.yaml não existir e a execução for interativa, dispara Init-Skills.ps1 antes.

.PARAMETER Path
    Caminho do arquivo skills.yaml. Padrão: skills.yaml na pasta atual.

.PARAMETER Silent
    Modo silencioso: só imprime avisos, erros e o resumo final. Pula o prompt
    interativo de remoção de extras e o bootstrap automático (usado por hooks automáticos).

.PARAMETER Detailed
    Mostra a saída completa e em tempo real do `npx skills add` para cada fonte.

.PARAMETER NoReconcile
    Pula a etapa de reconciliação (detectar/remover skills instaladas fora do manifesto).

.PARAMETER NoPull
    Pula o `git pull` automático e a checagem de commit/push pendente na cópia local de
    agents-instructions antes de ler bundles.yaml.

.PARAMETER BundlesPath
    Caminho local do bundles.yaml central. Padrão: bundles.yaml ao lado deste script
    (ou seja, na sua cópia local clonada de agents-instructions). Para atualizar o
    catálogo de bundles, dê git pull nessa pasta — não é buscado via rede.

.EXAMPLE
    ./Install-Skills.ps1
    ./Install-Skills.ps1 -Silent
    ./Install-Skills.ps1 -Detailed
    ./Install-Skills.ps1 -NoReconcile
#>
[CmdletBinding()]
param(
    [string]$Path = (Join-Path (Get-Location) 'skills.yaml'),
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

. (Join-Path $PSScriptRoot 'Skills.Common.ps1')

if (-not $NoPull) {
    Sync-BundlesRepo -BundlesPath $BundlesPath -Quiet:$Silent
    Assert-BundlesRepoPushed -BundlesPath $BundlesPath
}

if (-not (Test-Path $Path)) {
    if ($Silent) {
        Write-Error "Arquivo não encontrado: $Path. Rode Init-Skills.ps1 primeiro (não dá pra usar -Silent num projeto sem skills.yaml)."
        exit 1
    }

    Write-Host "skills.yaml não encontrado em $Path — iniciando configuração..." -ForegroundColor Yellow
    & (Join-Path $PSScriptRoot 'Init-Skills.ps1')
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $Path)) {
        Write-Error "Init-Skills.ps1 não gerou $Path. Abortando."
        exit 1
    }
}

$manifest = Read-ProjectManifest -FilePath $Path
$mergedSources = @{}

if ($manifest.Bundles.Count -gt 0) {
    $catalog = Get-BundlesCatalog -FilePath $BundlesPath
    foreach ($bundleName in $manifest.Bundles) {
        if (-not $catalog.Bundles.Contains($bundleName)) {
            Write-Warning "Bundle '$bundleName' não encontrado em bundles.yaml de $BundlesPath — ignorado."
            continue
        }
        Add-SkillSet -Table $mergedSources -Repo $catalog.Repo -Skills $catalog.Bundles[$bundleName]
    }
}

foreach ($src in $manifest.Sources) {
    Add-SkillSet -Table $mergedSources -Repo $src.Repo -Skills $src.Skills
}

$sources = $mergedSources.Keys | ForEach-Object {
    [pscustomobject]@{ Repo = $_; Skills = @($mergedSources[$_]) }
} | Where-Object { $_.Skills.Count -gt 0 }

if (-not $sources -or $sources.Count -eq 0) {
    Write-Error "Nenhuma skill resolvida a partir de bundles/sources em $Path"
    exit 1
}

$failed = @()
$i = 0
$totalSkills = ($sources | ForEach-Object { $_.Skills.Count } | Measure-Object -Sum).Sum
$sw = [System.Diagnostics.Stopwatch]::StartNew()

if (-not $Silent) {
    Write-Host ""
    Write-Host "Instalando $totalSkills skill(s) de $($sources.Count) fonte(s)..." -ForegroundColor Cyan
    Write-Host ""
}

foreach ($source in $sources) {
    $i++
    if (-not $Silent) {
        Write-Progress -Activity "Instalando skills" -Status "[$i/$($sources.Count)] $($source.Repo)" -PercentComplete (100 * ($i - 1) / $sources.Count)
        Write-Host ("  [{0,2}/{1}] " -f $i, $sources.Count) -ForegroundColor DarkGray -NoNewline
        Write-Host $source.Repo -ForegroundColor White -NoNewline
        Write-Host " ($($source.Skills.Count) skill(s))" -ForegroundColor DarkGray
        Write-Host "         $($source.Skills -join ', ')" -ForegroundColor DarkGray
    }

    $npxArgs = @('--yes', 'skills', 'add', $source.Repo, '-s') + $source.Skills + @('-y')
    $itemSw = [System.Diagnostics.Stopwatch]::StartNew()

    if ($Detailed) {
        & npx @npxArgs
        $exitCode = $LASTEXITCODE
    }
    else {
        $output = & npx @npxArgs 2>&1
        $exitCode = $LASTEXITCODE
        if ($exitCode -ne 0) { $output | Out-Host }
    }

    $itemSw.Stop()

    if ($exitCode -ne 0) {
        $failed += $source.Repo
        Write-Warning "Falha ao instalar/atualizar skills de $($source.Repo)"
    }
    elseif (-not $Silent) {
        Write-Host "         OK" -ForegroundColor Green -NoNewline
        Write-Host (" ({0:n1}s)" -f $itemSw.Elapsed.TotalSeconds) -ForegroundColor DarkGray
    }
}

$sw.Stop()
if (-not $Silent) {
    Write-Progress -Activity "Instalando skills" -Completed
    $ok = $sources.Count - $failed.Count
    Write-Host ""
    Write-Host "Concluído: " -NoNewline
    Write-Host "$ok/$($sources.Count) fonte(s)" -ForegroundColor $(if ($failed.Count -gt 0) { 'Yellow' } else { 'Green' }) -NoNewline
    Write-Host (" · $totalSkills skill(s) · {0:n1}s" -f $sw.Elapsed.TotalSeconds) -ForegroundColor DarkGray
}

if (-not $NoReconcile) {
    $required = [System.Collections.Generic.HashSet[string]]::new()
    foreach ($src in $sources) { foreach ($sk in $src.Skills) { [void]$required.Add($sk) } }

    $installedJson = & npx --yes skills list --json 2>&1
    if ($LASTEXITCODE -eq 0) {
        try {
            $installed = $installedJson | ConvertFrom-Json
            # Só considera skills instaladas via `skills add` (sourceType preenchido).
            # Skills escritas à mão no projeto (source: null) nunca entram na reconciliação.
            $installedNames = @($installed | Where-Object { $_.sourceType } | ForEach-Object { $_.name } | Sort-Object -Unique)
        }
        catch {
            $installedNames = @()
        }

        $extras = @($installedNames | Where-Object { -not $required.Contains($_) })

        if ($extras.Count -gt 0) {
            Write-Host ""
            Write-Host "Skills instaladas fora do manifesto deste projeto (bundles ad hoc esquecidos?):" -ForegroundColor Yellow
            $extras | ForEach-Object { Write-Host "  - $_" }

            if (-not $Silent) {
                $toRemove = @()
                $fzf = Get-Command fzf -ErrorAction SilentlyContinue
                try {
                    if ($fzf) {
                        $toRemove = @($extras | & fzf --multi --prompt="Remover skills> " --header="Tab marca, Enter confirma, Esc pula")
                    }
                    else {
                        $answer = Read-Host "Remover alguma? Nomes separados por espaço, ou Enter para pular"
                        if ($answer -and $answer.Trim()) {
                            $toRemove = @($answer.Trim() -split '\s+' | Where-Object { $extras -contains $_ })
                        }
                    }
                }
                catch {
                    Write-Warning "Terminal não interativo — pulando remoção automática."
                }
                if ($toRemove.Count -gt 0) {
                    & npx --yes skills remove @toRemove -y
                }
            }
        }
    }
    else {
        Write-Warning "Não foi possível listar skills instaladas para reconciliação."
    }
}

if ($failed.Count -gt 0) {
    Write-Error "Falhas em: $($failed -join ', ')"
    exit 1
}
