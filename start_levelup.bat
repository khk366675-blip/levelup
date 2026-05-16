@echo off
echo Killing any process on port 3002...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3002 " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo Starting LEVEL UP dev server...
start "" cmd /k "cd /d %~dp0 && npm run dev"

timeout /t 2 >nul
start "" http://localhost:3002
