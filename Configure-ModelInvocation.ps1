param(
    [Parameter(Mandatory)]
    [string]$SkillsPath
)

$openAiYamlContent = @"
policy:
  allow_implicit_invocation: false
"@

Get-ChildItem -Path $SkillsPath -Directory | ForEach-Object {
    $skillPath = $_.FullName
    $skillFile = Join-Path $skillPath "SKILL.md"

    if (-not (Test-Path $skillFile)) {
        return
    }

    $content = Get-Content $skillFile -Raw

    # Procura apenas no frontmatter YAML
    if ($content -notmatch '(?s)^---\s*\r?\n(.*?)\r?\n---') {
        return
    }

    $frontmatter = $Matches[1]

    if ($frontmatter -notmatch '(?im)^\s*disable-model-invocation\s*:\s*true\s*$') {
        return
    }

    $agentsPath = Join-Path $skillPath "agents"
    $openAiYamlPath = Join-Path $agentsPath "openai.yaml"

    if (Test-Path $openAiYamlPath) {
        Write-Host "Já existe: $openAiYamlPath"
        return
    }

    New-Item -ItemType Directory -Path $agentsPath -Force | Out-Null

    Set-Content `
        -Path $openAiYamlPath `
        -Value $openAiYamlContent `
        -Encoding utf8

    Write-Host "Criado: $openAiYamlPath"
}
