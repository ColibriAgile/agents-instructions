<#
Funções compartilhadas por Install-Skills.ps1 e Init-Skills.ps1.
Dot-source este arquivo: . (Join-Path $PSScriptRoot 'Skills.Common.ps1')
#>

$Script:GitignoreMarker = '# Artefatos gerados por `npx skills add`'

function Read-ProjectManifest {
    param([string]$FilePath)

    $sources = @()
    $bundleNames = @()
    $current = $null
    $section = $null

    foreach ($rawLine in Get-Content -Path $FilePath) {
        $line = $rawLine -replace '#.*$', ''
        if ($line.Trim() -eq '') { continue }

        if ($line -match '^bundles:\s*$') { $section = 'bundles'; continue }
        if ($line -match '^sources:\s*$') { $section = 'sources'; continue }

        if ($section -eq 'bundles' -and $line -match '^\s*-\s*(.+?)\s*$') {
            $bundleNames += $matches[1].Trim('"''')
            continue
        }

        if ($section -eq 'sources') {
            if ($line -match '^\s*-\s*repo:\s*(.+?)\s*$') {
                if ($current) { $sources += $current }
                $current = [pscustomobject]@{ Repo = ($matches[1].Trim('"''')); Skills = @() }
                continue
            }
            if ($line -match '^\s*skills:\s*$') { continue }
            if ($current -and $line -match '^\s*-\s*(.+?)\s*$') {
                $current.Skills += $matches[1].Trim('"''')
                continue
            }
        }
    }
    if ($current) { $sources += $current }

    return [pscustomobject]@{ Bundles = $bundleNames; Sources = $sources }
}

function Read-BundlesCatalog {
    param([string[]]$Lines)

    $repo = $null
    $bundles = [ordered]@{}
    $descriptions = @{}
    $currentBundle = $null
    $inSkills = $false

    foreach ($rawLine in $Lines) {
        $line = $rawLine -replace '#.*$', ''
        if ($line.Trim() -eq '') { continue }

        if ($line -match '^repo:\s*(.+?)\s*$') {
            $repo = $matches[1].Trim('"''')
            continue
        }
        if ($line -match '^\s{2}([\w-]+):\s*$') {
            $currentBundle = $matches[1]
            $bundles[$currentBundle] = @()
            $inSkills = $false
            continue
        }
        if ($line -match '^\s*description:\s*(.+?)\s*$') {
            if ($currentBundle) { $descriptions[$currentBundle] = $matches[1].Trim('"''') }
            $inSkills = $false
            continue
        }
        if ($line -match '^\s*skills:\s*$') {
            $inSkills = $true
            continue
        }
        if ($inSkills -and $currentBundle -and $line -match '^\s*-\s*(.+?)\s*$') {
            $bundles[$currentBundle] += $matches[1].Trim('"''')
            continue
        }
    }
    return [pscustomobject]@{ Repo = $repo; Bundles = $bundles; Descriptions = $descriptions }
}

function Get-BundlesCatalog {
    param([string]$FilePath)

    if (-not (Test-Path $FilePath)) {
        Write-Error "bundles.yaml não encontrado em $FilePath. Dê git pull na sua cópia local de agents-instructions."
        exit 1
    }
    return Read-BundlesCatalog -Lines (Get-Content -Path $FilePath)
}

function Sync-BundlesRepo {
    param([string]$BundlesPath, [switch]$Quiet)

    $repoRoot = Split-Path -Parent $BundlesPath
    if (-not (Test-Path (Join-Path $repoRoot '.git'))) { return }

    $output = git -C $repoRoot pull --ff-only 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "git pull falhou em $repoRoot — usando bundles.yaml local, pode estar desatualizado.`n$output"
    }
    elseif (-not $Quiet -and $output -notmatch 'Already up to date') {
        Write-Host "bundles.yaml atualizado ($repoRoot): $output" -ForegroundColor DarkGray
    }
}

function Assert-BundlesRepoPushed {
    param([string]$BundlesPath)

    $repoRoot = Split-Path -Parent $BundlesPath
    if (-not (Test-Path (Join-Path $repoRoot '.git'))) { return }

    $dirty = git -C $repoRoot status --porcelain
    if ($dirty) {
        Write-Error "Há mudanças não commitadas em $repoRoot (cópia local de agents-instructions). Commit e dê push antes de instalar — senão bundles.yaml pode referenciar uma skill que ainda não existe no remoto.`n$dirty"
        exit 1
    }

    $ahead = git -C $repoRoot rev-list --count '@{u}..HEAD' 2>$null
    if ($LASTEXITCODE -eq 0 -and [int]$ahead -gt 0) {
        Write-Error "$ahead commit(s) não enviados (push pendente) em $repoRoot. Dê git push antes de instalar skills."
        exit 1
    }
}

# Devolve a branch de onde instalar as skills do repositório do catálogo, ou $null para a
# branch padrão do remoto. Sem -Ref, usa a branch atual da cópia local; HEAD destacado
# cai na padrão. Branch fora da padrão precisa existir em origin e, quando detectada,
# estar no mesmo commit do HEAD local.
function Resolve-SkillsRef {
    param([string]$BundlesPath, [string]$Ref, [switch]$SkipRemoteCheck)

    $repoRoot = Split-Path -Parent $BundlesPath
    $isGit = Test-Path (Join-Path $repoRoot '.git')
    $explicit = -not [string]::IsNullOrWhiteSpace($Ref)
    $current = if ($isGit) { "$(git -C $repoRoot branch --show-current)".Trim() } else { '' }

    if (-not $explicit) {
        if (-not $current) { return $null }
        $Ref = $current
    }

    if ($explicit -and $current -and $current -ne $Ref) {
        Write-Warning "bundles.yaml vem da branch local '$current', mas as skills virão de '$Ref'. Faça checkout de '$Ref' para o catálogo corresponder."
    }

    if ($isGit) {
        $default = "$(git -C $repoRoot symbolic-ref --short refs/remotes/origin/HEAD 2>$null)".Trim() -replace '^origin/', ''
        if ($default -and $default -eq $Ref) { return $null }
    }

    if ($SkipRemoteCheck -or -not $isGit) { return $Ref }

    $remote = git -C $repoRoot ls-remote --heads origin "refs/heads/$Ref" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Não foi possível consultar origin para a branch '$Ref'.`n$remote"
        exit 1
    }
    if (-not $remote) {
        Write-Error "Branch '$Ref' não existe em origin. Dê git push -u origin $Ref antes de instalar."
        exit 1
    }
    if (-not $explicit) {
        $remoteSha = ("$remote".Trim() -split '\s+')[0]
        $localSha = "$(git -C $repoRoot rev-parse HEAD)".Trim()
        if ($remoteSha -ne $localSha) {
            Write-Error "HEAD local de '$Ref' ($($localSha.Substring(0, 7))) difere de origin/$Ref ($($remoteSha.Substring(0, 7))). Dê git push ou git pull antes de instalar."
            exit 1
        }
    }
    return $Ref
}

function Add-SkillSet {
    param([hashtable]$Table, [string]$Repo, [string[]]$Skills)
    if (-not $Table.ContainsKey($Repo)) {
        $Table[$Repo] = [System.Collections.Generic.HashSet[string]]::new()
    }
    foreach ($s in $Skills) { [void]$Table[$Repo].Add($s) }
}

function Set-SkillsGitignore {
    param([string]$ProjectPath)

    $gitignorePath = Join-Path $ProjectPath '.gitignore'
    $alreadyThere = (Test-Path $gitignorePath) -and
        (Select-String -Path $gitignorePath -Pattern ([regex]::Escape($Script:GitignoreMarker)) -Quiet)

    if ($alreadyThere) {
        return $false
    }

    $block = @(
        ''
        "$Script:GitignoreMarker (Install-Skills.ps1) — reproduzíveis a"
        '# partir de skills.yaml + bundles.yaml, não são fonte de verdade.'
        '.agents/'
        '.claude/skills/'
        '.codex/skills/'
        'skills-lock.json'
    )
    Add-Content -Path $gitignorePath -Value $block -Encoding UTF8
    return $true
}
