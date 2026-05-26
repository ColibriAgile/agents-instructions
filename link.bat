@echo off
setlocal

set "SOURCE=%~dp0SKILLS"
set "TARGET=%USERPROFILE%\.copilot\skills"

echo Origem : %SOURCE%
echo Destino: %TARGET%

REM Remove a pasta/link existente se existir
if exist "%TARGET%" (
    echo Removendo destino existente...

    REM Tenta remover como junction/symlink
    rmdir "%TARGET%" 2>nul

    REM Se ainda existir, remove conteúdo normal
    if exist "%TARGET%" (
        rmdir /s /q "%TARGET%"
    )
)

REM Garante que a pasta .copilot exista
if not exist "%USERPROFILE%\.copilot" (
    mkdir "%USERPROFILE%\.copilot"
)

REM Cria a junction
mklink /J "%TARGET%" "%SOURCE%"

echo.
echo Junction criada com sucesso.
pause