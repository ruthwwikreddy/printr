@echo off
title Printr Windows Print Agent Daemon
echo ========================================================
echo        PRINTR WINDOWS PRINT AGENT SERVICE LAUNCHER
echo ========================================================
echo.

set /p TENANT_ID="Enter your unique Shop Slug (e.g. city-xerox or demo-prints): "
set /p PRINT_AGENT_AUTH_SECRET="Enter your Shop Agent Secret Key from Dashboard: "

set BACKEND_URL=https://printr.ruthwikreddy.live
set NODE_ENV=production

echo.
echo Starting Printr Agent for shop '%TENANT_ID%'...
echo Backend: %BACKEND_URL%
echo.

node agent.js
pause
