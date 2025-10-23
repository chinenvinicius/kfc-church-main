@echo off
REM Dynamic WSL port forwarding setup for Windows
REM Run this as Administrator in Windows Command Prompt or PowerShell

echo Detecting WSL IP address...

REM Get WSL IP using wsl command
for /f "tokens=2" %%i in ('wsl hostname -I') do set WSL_IP=%%i
echo Detected WSL IP: %WSL_IP%

REM Remove existing port forwarding if it exists
netsh interface portproxy show v4tov4 | findstr "3500" >nul
if %errorlevel% equ 0 (
    echo Removing existing port forwarding...
    netsh interface portproxy delete v4tov4 listenport=3500 listenaddress=127.0.0.1
)

REM Set up new port forwarding
echo Setting up port forwarding: Windows localhost:3500 -^> WSL %WSL_IP%:3500
netsh interface portproxy add v4tov4 listenport=3500 listenaddress=127.0.0.1 connectport=3500 connectaddress=%WSL_IP%

echo.
echo Port forwarding setup complete!
echo You can now access your app at: http://localhost:3500
echo.
echo To remove forwarding later, run: netsh interface portproxy delete v4tov4 listenport=3500 listenaddress=127.0.0.1
echo.
pause
