@echo off
setlocal
cd /d "%~dp0.."

echo ====================================================
echo        STARTING AESTHETICNOVA E-COMMERCE
echo ====================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Error: Node.js is not installed.
  echo Please install Node.js 20 or newer from https://nodejs.org/
  pause
  exit /b 1
)

set "NODE_ENV=development"
set "PORT=3000"
set "PAYMENT_MODE=demo"
set "ADMIN_EMAIL=owner@aestheticnova.local"
set "ADMIN_PASSWORD=LocalDemo-Only-Change-This-7391!"
set "PRIVACY_HASH_SALT=local-demo-only-salt-change-before-production-7391"

if not exist "node_modules" (
  echo Dependencies not found. Installing now...
  call npm install
  if errorlevel 1 (
    echo [ERROR] Dependency installation failed. Check internet connection and try again.
    pause
    exit /b 1
  )
)

echo.
echo Application Configuration:
echo ----------------------------------------------------
echo Website URL:       http://localhost:3000
echo Admin Portal:      http://localhost:3000/admin/login
echo Admin Email:       owner@aestheticnova.local
echo Admin Password:    LocalDemo-Only-Change-This-7391!
echo Payment Mode:      DEMO SIMULATOR (No real money charged)
echo ----------------------------------------------------
echo Keep this command prompt window open while browsing.
echo Press Ctrl+C in this window to stop the server.
echo.

node server.js
pause
