@echo off
setlocal

set "BASE_SOURCE=%~dp0"
set "BASE_TARGET=%USERPROFILE%\.copilot"

call :CreateJunction "SKILLS" "skills"
call :CreateJunction "INSTRUCTIONS" "instructions"
call :CreateJunction "AGENTS" "agents"

echo.
echo Todas as junctions foram criadas.
pause
exit /b


:CreateJunction
set "SOURCE=%BASE_SOURCE%%~1"
set "TARGET=%BASE_TARGET%\%~2"

echo.
echo ========================================
echo Origem : %SOURCE%
echo Destino: %TARGET%

REM Remove destino existente
if exist "%TARGET%" (
    echo Removendo destino existente...

    rmdir "%TARGET%" 2>nul

    if exist "%TARGET%" (
        rmdir /s /q "%TARGET%"
    )
)

REM Garante que .copilot exista
if not exist "%BASE_TARGET%" (
    mkdir "%BASE_TARGET%"
)

REM Cria junction
mklink /J "%TARGET%" "%SOURCE%"

goto :eof