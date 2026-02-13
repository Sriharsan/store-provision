@echo off
REM Store Provisioning Platform - Start Both Services (Windows Batch)
REM This is a Windows alternative to app.py

echo ============================================================
echo Store Provisioning Platform - Starting Services
echo ============================================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Change to project root
cd /d "%~dp0"

REM Install backend dependencies if needed
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    if errorlevel 1 (
        echo Failed to install backend dependencies
        pause
        exit /b 1
    )
    cd ..
)

REM Install dashboard dependencies if needed
if not exist "dashboard\node_modules" (
    echo Installing dashboard dependencies...
    cd dashboard
    call npm install
    if errorlevel 1 (
        echo Failed to install dashboard dependencies
        pause
        exit /b 1
    )
    cd ..
)

echo.
echo ============================================================
echo Starting Backend API (Port 12000)...
echo ============================================================
start "Backend API" cmd /k "cd backend && npm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

echo.
echo ============================================================
echo Starting Dashboard (Port 8082)...
echo ============================================================
start "Dashboard" cmd /k "cd dashboard && npm run dev"

echo.
echo ============================================================
echo Both services are starting in separate windows
echo ============================================================
echo.
echo Access the dashboard at: http://localhost:8082
echo API endpoint: http://localhost:12000
echo.
echo Close the windows or press Ctrl+C in each window to stop
echo ============================================================
echo.

REM Keep this window open
pause
