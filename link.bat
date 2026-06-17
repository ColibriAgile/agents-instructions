@echo off
setlocal

set "BASE_SOURCE=%~dp0"
set "BASE_COPILOT=%USERPROFILE%\.copilot"
set "BASE_CODEX=%USERPROFILE%\.codex"

call :CreateJunction "%BASE_COPILOT%" "SKILLS"      "skills"
call :CreateJunction "%BASE_COPILOT%" "INSTRUCTIONS" "instructions"
call :CreateJunction "%BASE_COPILOT%" "AGENTS"       "agents"

call :CreateJunction "%BASE_CODEX%"   "SKILLS"       "skills"

echo.
echo Todas as junctions foram criadas.
pause
exit /b


:CreateJunction
set "BASE=%~1"
set "SOURCE=%BASE_SOURCE%%~2"
set "TARGET=%BASE%\%~3"

echo.
echo ========================================
echo Origem : %SOURCE%
echo Destino: %TARGET%

REM Garante que o diretório base exista
if not exist "%BASE%" (
    mkdir "%BASE%"
)

REM Remove destino existente
if exist "%TARGET%" (
    echo Removendo destino existente...
    rmdir "%TARGET%" 2>nul
    if exist "%TARGET%" (
        rmdir /s /q "%TARGET%"
    )
)

REM Cria junction
mklink /J "%TARGET%" "%SOURCE%"

goto :eof