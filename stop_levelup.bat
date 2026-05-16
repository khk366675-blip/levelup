@echo off
echo Stopping LEVEL UP dev server (port 3002)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3002 " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
    echo Killed PID %%a
)
echo Done.
