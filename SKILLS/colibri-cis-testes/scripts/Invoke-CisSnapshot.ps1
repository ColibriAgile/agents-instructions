# Cria, restaura, remove ou lista o snapshot SQL Server do banco do POS usado nos testes do CIS.
# O banco e o servidor vêm da seção [Banco] do ncrmaster.cfg (chaves banco_pos e servidor).
param(
  [Parameter(Mandatory)]
  [ValidateSet('Status', 'Criar', 'Restaurar', 'Remover')]
  [string]$Acao,
  [string]$Cfg = 'C:\Sistema Colibri\master\config\ncrmaster.cfg',
  [string]$Banco,
  [string]$Servidor,
  [string]$Nome
)

$ErrorActionPreference = 'Stop'

function Ler-Cfg([string]$Arquivo, [string]$Secao, [string]$Chave) {
  if (-not (Test-Path $Arquivo)) {
    throw "Arquivo de configuração não encontrado: $Arquivo"
  }

  $secaoAtual = ''

  foreach ($linha in Get-Content $Arquivo) {
    if ($linha -match '^\s*\[(.+?)\]\s*$') {
      $secaoAtual = $Matches[1]
    }
    elseif ($secaoAtual -ieq $Secao -and $linha -match '^\s*([^=]+?)\s*=\s*(.*?)\s*$' -and $Matches[1] -ieq $Chave) {
      return $Matches[2]
    }
  }

  return ''
}

function Invoke-Sql([string]$Sql) {
  $saida = & sqlcmd -S $Servidor -E -b -W -h -1 -Q "SET NOCOUNT ON; $Sql" 2>&1

  if ($LASTEXITCODE -ne 0) {
    throw "sqlcmd falhou ($LASTEXITCODE): $($saida -join [Environment]::NewLine)"
  }

  return @($saida | Where-Object { "$_".Trim() -ne '' } | ForEach-Object { "$_".Trim() })
}

if (-not (Get-Command sqlcmd -ErrorAction SilentlyContinue)) {
  throw 'sqlcmd não encontrado no PATH.'
}

if (-not $Banco) { $Banco = Ler-Cfg $Cfg 'Banco' 'banco_pos' }
if (-not $Servidor) { $Servidor = Ler-Cfg $Cfg 'Banco' 'servidor' }
if (-not $Banco) { throw "Chave [Banco] banco_pos vazia em $Cfg." }
if (-not $Servidor) { $Servidor = 'localhost' }
if (-not $Nome) { $Nome = "${Banco}_cis_teste" }

$bancoSql = $Banco.Replace("'", "''")
$nomeSql = $Nome.Replace("'", "''")
$nomeId = $Nome.Replace(']', ']]')
$bancoId = $Banco.Replace(']', ']]')

if (-not (Invoke-Sql "SELECT 1 FROM sys.databases WHERE name = N'$bancoSql' AND source_database_id IS NULL")) {
  throw "Banco '$Banco' não existe em '$Servidor'."
}

$snapshots = Invoke-Sql "SELECT name FROM sys.databases WHERE source_database_id = DB_ID(N'$bancoSql') ORDER BY create_date"
$outros = @($snapshots | Where-Object { $_ -ne $Nome })
$existe = $snapshots -contains $Nome

Write-Host "Banco: $Banco | Servidor: $Servidor | Snapshot da skill: $Nome"

switch ($Acao) {
  'Status' {
    Write-Host "Snapshots de ${Banco}: $(if ($snapshots) { $snapshots -join ', ' } else { '(nenhum)' })"
    Write-Host "Snapshot da skill existe: $existe"
    if ($outros) { Write-Host "Snapshots de terceiros (bloqueiam Restaurar): $($outros -join ', ')" }
  }

  'Criar' {
    if ($existe) {
      throw "Snapshot '$Nome' já existe (sobra de uma execução anterior). Decida com o usuário entre Restaurar e Remover antes de criar outro."
    }

    $arquivos = Invoke-Sql "SELECT name + '|' + physical_name FROM [$bancoId].sys.database_files WHERE type_desc = 'ROWS'"
    $clausulas = foreach ($arquivo in $arquivos) {
      $logico, $fisico = $arquivo -split '\|', 2
      $destino = Join-Path (Split-Path $fisico -Parent) "${Nome}_$logico.ss"
      "(NAME = [$($logico.Replace(']', ']]'))], FILENAME = N'$($destino.Replace("'", "''"))')"
    }

    Invoke-Sql "CREATE DATABASE [$nomeId] ON $($clausulas -join ', ') AS SNAPSHOT OF [$bancoId]" | Out-Null
    Write-Host "Snapshot '$Nome' criado."
    if ($outros) { Write-Host "Aviso: há outros snapshots de ${Banco} ($($outros -join ', ')); Restaurar ficará bloqueado enquanto existirem." }
  }

  'Restaurar' {
    if (-not $existe) {
      throw "Snapshot '$Nome' não existe; não há o que restaurar."
    }

    if ($outros) {
      throw "Restauração bloqueada: o SQL Server só restaura um banco com um único snapshot. Snapshots de terceiros: $($outros -join ', '). Nada foi alterado."
    }

    Invoke-Sql @"
ALTER DATABASE [$bancoId] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
BEGIN TRY
  RESTORE DATABASE [$bancoId] FROM DATABASE_SNAPSHOT = N'$nomeSql';
  ALTER DATABASE [$bancoId] SET MULTI_USER;
END TRY
BEGIN CATCH
  ALTER DATABASE [$bancoId] SET MULTI_USER;
  THROW;
END CATCH
"@ | Out-Null
    Write-Host "Banco '$Banco' restaurado a partir de '$Nome'. O snapshot continua existindo; rode -Acao Remover."
  }

  'Remover' {
    if (-not $existe) {
      Write-Host "Snapshot '$Nome' não existe; nada a remover."
      return
    }

    Invoke-Sql "DROP DATABASE [$nomeId]" | Out-Null
    Write-Host "Snapshot '$Nome' removido."
  }
}
