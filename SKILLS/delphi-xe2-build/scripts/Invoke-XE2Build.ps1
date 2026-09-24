# Compila um projeto Delphi XE2 (.dproj de aplicação ou de pacote) usando o MSBuild.
param(
  [Parameter(Mandatory)]
  [string]$Dproj,
  [string]$Config = "Release",
  [string]$Platform = "Win32",
  [string]$DcuOut = "../../dcu",
  [string]$BplOut = "../../dcu",
  [string]$DcpOut = $BplOut,
  [string]$ExeOut = "temp",
  [string[]]$UnitSearchPath = @("D:/Vcl/Xe2lib", "D:/Vcl/Xe2bpl", "D:/Vcl/co2lib"),
  [string]$SistemaColibri = $env:SISTEMA_COLIBRI,
  [string]$RsVars = "C:\Program Files (x86)\Embarcadero\RAD Studio\9.0\bin\rsvars.bat",
  [string]$MsBuild = "$env:WINDIR\Microsoft.NET\Framework\v4.0.30319\MSBuild.exe"
)

Write-Host "Iniciando a compilação de $Dproj..."

if (-not (Test-Path $Dproj)) {
  throw "Arquivo de projeto não encontrado: $Dproj"
}

if (-not (Test-Path $RsVars)) {
  throw "rsvars.bat do RAD Studio XE2 não encontrado: $RsVars"
}

if (-not (Test-Path $MsBuild)) {
  throw "MSBuild .NET 4 não encontrado: $MsBuild"
}

if (-not $SistemaColibri) {
  $SistemaColibri = [Environment]::GetEnvironmentVariable('SISTEMA_COLIBRI', 'User')
}

if (-not $SistemaColibri) {
  $SistemaColibri = [Environment]::GetEnvironmentVariable('SISTEMA_COLIBRI', 'Machine')
}

if (-not $SistemaColibri) {
  throw "Variável SISTEMA_COLIBRI não definida. Informe -SistemaColibri ou defina a variável."
}

# Os .dproj usam $(NCRColibri) no ExeOutput e nos eventos de build.
$SistemaColibri = $SistemaColibri.TrimEnd('\', '/')

foreach ($pasta in @($DcuOut, $BplOut, $DcpOut, $ExeOut)) {
  if (-not (Test-Path $pasta)) {
    Write-Host "📂 Criando pasta de output » $([System.IO.Path]::GetFullPath($pasta))"
    New-Item -Path $pasta -ItemType Directory -Force | Out-Null
  }
}

foreach ($pasta in $UnitSearchPath) {
  if (-not (Test-Path $pasta)) {
    Write-Warning "Pasta do caminho de units não existe: $pasta"
  }
}

Write-Host "ℹ️ Usando MSBUILD » `"$MsBuild`""
Write-Host "ℹ️ Usando SISTEMA_COLIBRI » `"$SistemaColibri`""

# O MSBuild separa propriedades em ';' quando o valor não está entre aspas.
$unitSearchPathArg = "/p:DCC_UnitSearchPath=`"$($UnitSearchPath -join ';')`""
$dcuOutputPath = "/p:DCC_DcuOutput=`"$DcuOut`""
$bplOutputPath = "/p:DCC_BplOutput=`"$BplOut`""
$dcpOutputPath = "/p:DCC_DcpOutput=`"$DcpOut`""
$exeOutputPath = "/p:DCC_ExeOutput=`"$ExeOut`""
$sistemaColibriArg = "/p:NCRColibri=`"$SistemaColibri`""
$cmd = "call `"$RsVars`" && `"$MsBuild`" `"$Dproj`" /t:Build /p:Config=$Config;Platform=$Platform $exeOutputPath $dcuOutputPath $bplOutputPath $dcpOutputPath $unitSearchPathArg $sistemaColibriArg"
cmd /c $cmd

if ($LASTEXITCODE) {
  throw "Build falhou ($LASTEXITCODE)"
}
