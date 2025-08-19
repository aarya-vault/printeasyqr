@echo off
echo ================================
echo PrintEasy QR Windows Production Setup
echo ================================

echo.
echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found!
    echo Please install Node.js 20+ from: https://nodejs.org
    pause
    exit /b 1
)
echo ✅ Node.js found

echo.
echo [2/5] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed

echo.
echo [3/5] Checking environment configuration...
if not exist .env (
    echo ⚠️  .env file not found, creating from template...
    copy .env.template .env
    echo.
    echo ❗ IMPORTANT: Edit .env file with your database credentials
    echo Database URL format: postgresql://user:password@host:5432/database
    echo.
    echo Press any key after editing .env file...
    pause
)
echo ✅ Environment configuration ready

echo.
echo [4/5] Building application...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)
echo ✅ Application built

echo.
echo [5/5] Starting production server...
echo ================================
echo Starting PrintEasy QR Production Server
echo ================================
echo.
node production-start.js

pause