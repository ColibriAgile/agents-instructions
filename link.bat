@echo off
setlocal

set "BASE_SOURCE=%~dp0"

call :CreateLinks "SKILLS" "skills"
call :CreateLinks "INSTRUCTIONS" "instructions"
call :CreateLinks "AGENTS" "agents"

echo.
echo Todas as junctions foram criadas.
pause
exit /b


:CreateLinks
call :CreateJunction "%~1" "%~2" "%USERPROFILE%\.copilot"
call :CreateJunction "%~1" "%~2" "%USERPROFILE%\.codex"
goto :eof


:CreateJunction
set "SOURCE=%BASE_SOURCE%%~1"
set "BASE_TARGET=%~3"
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

REM Garante que a pasta base exista
if not exist "%BASE_TARGET%" (
    mkdir "%BASE_TARGET%"
)

REM Cria junction
mklink /J "%TARGET%" "%SOURCE%"

goto :eof