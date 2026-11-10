@echo off
setlocal
cd /d "%~dp0.."

echo ====================================================
echo        AESTHETICNOVA - DEVELOPMENT MODE
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
)

echo Starting server with live file watch...
echo URL: http://localhost:3000
echo.

node --watch server.js
pause
