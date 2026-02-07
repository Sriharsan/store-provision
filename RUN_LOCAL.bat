@echo off
echo ========================================
echo Store Provisioning Platform - Local Run
echo ========================================
echo.

echo Step 1: Installing backend dependencies...
cd backend
if not exist node_modules (
    echo Installing npm packages...
    call npm install
) else (
    echo Dependencies already installed.
)
echo.

echo Step 2: Installing dashboard dependencies...
cd ..\dashboard
if not exist node_modules (
    echo Installing npm packages...
    call npm install
) else (
    echo Dependencies already installed.
)
echo.

echo ========================================
echo Setup complete!
echo.
echo To run the project:
echo.
echo Terminal 1 - Backend:
echo   cd backend
echo   npm run dev
echo.
echo Terminal 2 - Dashboard:
echo   cd dashboard
echo   npm run dev
echo.
echo Then open: http://localhost:3000
echo ========================================
pause
