@echo off
setlocal
cd /d "%~dp0.."

where node >nul 2>nul
if errorlevel 1 (
  echo Error: Node.js is not installed.
  pause
  exit /b 1
)

node scripts/build.js
if errorlevel 1 (
  echo [ERROR] Verification build failed.
  pause
  exit /b 1
)

pause
