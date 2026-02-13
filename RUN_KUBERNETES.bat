@echo off
echo ========================================
echo Store Provisioning Platform - Kubernetes Setup
echo ========================================
echo.

echo Step 1: Creating k3d cluster...
k3d cluster create store-provisioning --port "8080:80@loadbalancer" --wait
if errorlevel 1 (
    echo ERROR: Failed to create cluster. Make sure k3d is installed.
    pause
    exit /b 1
)
echo.

echo Step 2: Building Docker images...
echo Building backend...
docker build -t store-provisioning-api:latest ./backend
if errorlevel 1 (
    echo ERROR: Failed to build backend image.
    pause
    exit /b 1
)

echo Building dashboard...
docker build -t store-provisioning-dashboard:latest ./dashboard
if errorlevel 1 (
    echo ERROR: Failed to build dashboard image.
    pause
    exit /b 1
)
echo.

echo Step 3: Loading images into cluster...
k3d image import store-provisioning-api:latest -c store-provisioning
k3d image import store-provisioning-dashboard:latest -c store-provisioning
echo.

echo Step 4: Creating namespace...
kubectl create namespace platform
echo.

echo Step 5: Installing platform via Helm...
helm install platform ./charts/platform --namespace platform -f charts/platform/values-local.yaml --set api.image.repository=store-provisioning-api --set dashboard.image.repository=store-provisioning-dashboard
if errorlevel 1 (
    echo ERROR: Failed to install platform. Make sure Helm is installed.
    pause
    exit /b 1
)
echo.

echo Step 6: Waiting for platform to be ready...
kubectl wait --for=condition=available --timeout=300s deployment/platform-api -n platform
kubectl wait --for=condition=available --timeout=300s deployment/platform-dashboard -n platform
echo.

echo ========================================
echo Setup complete!
echo.
echo To access dashboard, run in a new terminal:
echo   kubectl port-forward -n platform svc/platform-dashboard 8082:80
echo.
echo Then open: http://localhost:8082
echo ========================================
pause
