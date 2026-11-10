@echo off
setlocal
cd /d "%~dp0.."

echo ====================================================
echo        AESTHETICNOVA - DEPENDENCY INSTALLER
echo ====================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Error: Node.js is not installed.
  echo Please install Node.js 20 or newer from https://nodejs.org/
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo Error: npm is not available in PATH.
  pause
  exit /b 1
)

echo Installing dependencies via npm...
call npm install
if errorlevel 1 (
  echo.
  echo [ERROR] Installation failed. Check your network or file permissions.
  pause
  exit /b 1
)

echo.
echo [SUCCESS] All dependencies installed successfully!
echo You can now start the website by running batch\start.bat
echo.
pause
