#!/bin/bash
# Store Provisioning Platform - Start Both Services (Linux/Mac)
# This is a Unix alternative to app.py

echo "============================================================"
echo "Store Provisioning Platform - Starting Services"
echo "============================================================"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Download from: https://nodejs.org/"
    exit 1
fi

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Install backend dependencies if needed
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend
    npm install
    if [ $? -ne 0 ]; then
        echo "Failed to install backend dependencies"
        exit 1
    fi
    cd ..
fi

# Install dashboard dependencies if needed
if [ ! -d "dashboard/node_modules" ]; then
    echo "Installing dashboard dependencies..."
    cd dashboard
    npm install
    if [ $? -ne 0 ]; then
        echo "Failed to install dashboard dependencies"
        exit 1
    fi
    cd ..
fi

echo
echo "============================================================"
echo "Starting Backend API (Port 3001)..."
echo "============================================================"
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

echo
echo "============================================================"
echo "Starting Dashboard (Port 3000)..."
echo "============================================================"
cd dashboard
npm run dev &
DASHBOARD_PID=$!
cd ..

echo
echo "============================================================"
echo "Both services are starting..."
echo "============================================================"
echo
echo "Access the dashboard at: http://localhost:3000"
echo "API endpoint: http://localhost:3001"
echo
echo "Press Ctrl+C to stop all services"
echo "============================================================"
echo

# Function to cleanup on exit
cleanup() {
    echo
    echo "Shutting down services..."
    kill $BACKEND_PID 2>/dev/null
    kill $DASHBOARD_PID 2>/dev/null
    echo "Services stopped"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT TERM

# Wait for processes
wait
