# Printr Agent PowerShell Launcher for Windows
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "         PRINTR HARDWARE PRINT DAEMON (POWERSHELL)     " -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js is not found. Please install from https://nodejs.org/" -ForegroundColor Red
    Read-Host "Press Enter to exit..."
    exit 1
}

if (-not $env:BACKEND_URL) {
    $inputUrl = Read-Host "Enter your deployed Printr website URL (or press Enter for http://localhost:3000)"
    if ($inputUrl) {
        $env:BACKEND_URL = $inputUrl
    } else {
        $env:BACKEND_URL = "http://localhost:3000"
    }
}

if (-not $env:PRINT_AGENT_AUTH_SECRET) {
    $env:PRINT_AGENT_AUTH_SECRET = "99022997a3d1dd327bd67ed57eb370f25095edaccb2bd09db7678d8ea3f5ce63"
}

Write-Host "Connecting to: $env:BACKEND_URL" -ForegroundColor Green
node "$PSScriptRoot\agent.js"
