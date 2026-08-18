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
