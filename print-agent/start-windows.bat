@echo off
TITLE Printr Hardware Daemon Launcher
COLOR 0A

echo =======================================================
echo          PRINTR HARDWARE PRINT DAEMON (WINDOWS)
echo =======================================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please download and install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Set default Backend URL if not set
if "%BACKEND_URL%"=="" (
    set /p BACKEND_URL="Enter your deployed Printr website URL (e.g. https://print.myshop.com or press ENTER for http://localhost:3000): "
)
if "%BACKEND_URL%"=="" (
    set BACKEND_URL=http://localhost:3000
)

if "%PRINT_AGENT_AUTH_SECRET%"=="" (
    set PRINT_AGENT_AUTH_SECRET=99022997a3d1dd327bd67ed57eb370f25095edaccb2bd09db7678d8ea3f5ce63
)

echo.
echo Connecting to Hub: %BACKEND_URL%
echo.

node "%~dp0agent.js"

pause
