# How to Run the Project

## 📁 Project Location

All files are in: **`d:\Store Provisioning\`**

## 🚀 Two Ways to Run

### Option 1: Local Development (No Kubernetes - Fastest for Testing)

This runs the backend and dashboard locally without Docker/Kubernetes. Good for development and testing the UI.

#### Step 1: Install Dependencies

```bash
# Navigate to project root
cd "d:\Store Provisioning"

# Install backend dependencies
cd backend
npm install

# Install dashboard dependencies
cd ../dashboard
npm install
```

#### Step 2: Run Backend API

```bash
# In backend directory
cd backend
npm run dev

# Backend will run on http://localhost:3001
```

#### Step 3: Run Dashboard (New Terminal)

```bash
# In dashboard directory
cd dashboard
npm run dev

# Dashboard will run on http://localhost:3000
```

#### Step 4: Access Dashboard

Open browser: **http://localhost:3000**

**Note**: This mode won't actually provision stores (needs Kubernetes), but you can test the UI and API endpoints.

---

### Option 2: Full Kubernetes Deployment (Production-like)

This runs everything in Kubernetes and actually provisions stores. This is what you'll demo.

#### Prerequisites Check

```bash
# Check if you have these installed:
docker --version
kubectl version --client
helm version
k3d version  # or kind version
```

If missing, install:
- **Docker Desktop**: https://www.docker.com/products/docker-desktop
- **kubectl**: https://kubernetes.io/docs/tasks/tools/
- **Helm**: https://helm.sh/docs/intro/install/
- **k3d**: https://k3d.io/ (or use kind: https://kind.sigs.k8s.io/)

#### Step 1: Create Kubernetes Cluster

```bash
# Navigate to project root
cd "d:\Store Provisioning"

# Create k3d cluster
k3d cluster create store-provisioning --port "8080:80@loadbalancer" --wait
```

#### Step 2: Build Docker Images

```bash
# Build backend image
docker build -t store-provisioning-api:latest ./backend

# Build dashboard image
docker build -t store-provisioning-dashboard:latest ./dashboard
```

#### Step 3: Load Images into Cluster

```bash
# Load images into k3d
k3d image import store-provisioning-api:latest -c store-provisioning
k3d image import store-provisioning-dashboard:latest -c store-provisioning
```

#### Step 4: Install Platform via Helm

```bash
# Create namespace
kubectl create namespace platform

# Install platform
helm install platform ./charts/platform \
  --namespace platform \
  -f charts/platform/values-local.yaml \
  --set api.image.repository=store-provisioning-api \
  --set api.image.repository=store-provisioning-dashboard
```

#### Step 5: Wait for Platform to be Ready

```bash
# Check status
kubectl get pods -n platform

# Wait for API to be ready
kubectl wait --for=condition=available --timeout=300s deployment/platform-api -n platform

# Wait for Dashboard to be ready
kubectl wait --for=condition=available --timeout=300s deployment/platform-dashboard -n platform
```

#### Step 6: Access Dashboard

```bash
# Port forward to access dashboard
kubectl port-forward -n platform svc/platform-dashboard 3000:80
```

Open browser: **http://localhost:3000**

---

## 📝 Quick Reference: Main Files

### Entry Points:
- **Backend**: `backend/src/index.ts` - Main API server
- **Dashboard**: `dashboard/src/main.tsx` - React app entry point

### Configuration:
- **Backend**: `backend/package.json` - Dependencies and scripts
- **Dashboard**: `dashboard/package.json` - Dependencies and scripts
- **Helm Charts**: `charts/` - Kubernetes deployment configs

### Key Scripts:

**Backend:**
```bash
cd backend
npm run dev      # Development mode (auto-reload)
npm run build    # Build TypeScript
npm start        # Run production build
```

**Dashboard:**
```bash
cd dashboard
npm run dev      # Development mode (Vite dev server)
npm run build    # Build for production
npm run preview  # Preview production build
```

---

## 🔧 Troubleshooting

### Backend won't start:
```bash
cd backend
npm install
npm run dev
```

### Dashboard won't start:
```bash
cd dashboard
npm install
npm run dev
```

### Kubernetes issues:
```bash
# Check cluster status
kubectl cluster-info

# Check pods
kubectl get pods -n platform

# View logs
kubectl logs -n platform deployment/platform-api
kubectl logs -n platform deployment/platform-dashboard
```

### Port already in use:
```bash
# Change port in dashboard/vite.config.ts (line 6)
# Or kill process using port 3000/3001
```

---

## ✅ Verify It's Working

1. **Backend Health Check**: http://localhost:3001/health
   - Should return: `{"status":"ok","timestamp":"..."}`

2. **Dashboard**: http://localhost:3000
   - Should show "Store Provisioning Control Plane" header

3. **API Endpoints**: http://localhost:3001/api/stores
   - Should return: `[]` (empty array initially)

---

## 🎯 Recommended: Start with Option 1

For first-time setup, use **Option 1 (Local Development)** to:
- Test the UI quickly
- Verify code works
- Make changes easily

Then use **Option 2 (Kubernetes)** for:
- Full end-to-end testing
- Demo video recording
- Production-like environment
