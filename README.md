# Store Provisioning Platform (Urumi AI Round 1)

A Kubernetes-native platform for on-demand provisioning of **Medusa** e-commerce stores. Designed for **Local Development (Kind/k3d)** and **Production (VPS/k3s)** using the same Helm charts.

## 🏗️ Architecture

- **Orchestration**: Node.js Backend with programmatic Helm execution.
- **State**: PostgreSQL (StatefulSet per store, per-tenant isolation).
- **Frontend**: React Dashboard for managing stores.
- **Infrastructure**:
    - **Isolation**: One Namespace per store (`store-<id>`).
    - **Networking**: Ingress with dynamic routing (`.nip.io` local, custom domain prod).
    - **Security**: NetworkPolicies, ResourceQuotas, Limits.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Docker Desktop** (or k3d/kind/minikube)
- **Node.js 18+** & **npm**
- **Helm 3.x**
- **kubectl**
- **Python 3** (for the unified start script)

### 1. Unified Start (Recommended)
We provide a script to setup the database, backend, and dashboard automatically.

1.  **Ensure PostgreSQL is running locally** (outside K8s, for the Platform API).
    - User: `postgres`, Pass: `postgres`, DB: `store_provisioning`
    - (Or update `backend/.env` after first run)

2.  **Run the App**:
    ```bash
    # Installs dependencies & starts Backend + Dashboard
    python app.py
    ```

3.  **Access Dashboard**: [http://localhost:3000](http://localhost:3000)

### 2. Manual Start (Alternative)
If you prefer running services individually:

**Backend (Port 3001)**:
```bash
cd backend
npm install
npm run dev
```

**Dashboard (Port 3000)**:
```bash
cd dashboard
npm install
npm run dev
```

---

## 🛠️ Kubernetes Cluster Setup (Local)

To actually provision stores, you need a local Kubernetes cluster.

### 1. Create Cluster (k3d example)
```bash
k3d cluster create store-provisioning --port "8080:80@loadbalancer" --wait
```

### 2. Verify Access
```bash
kubectl cluster-info
```

*The platform backend automatically uses your local `kubectl` context (`~/.kube/config`).*

---

## 📦 Production Deployment (VPS / k3s)

This project is ready for production on a VPS (like shared DigitalOcean/Hetzner box running k3s).

### 1. Update Configuration
Edit `charts/medusa-store/values-prod.yaml`:
- Set `ingress.host` to your domain (e.g., `store.example.com`).
- Update `postgresql.storageClass` if needed (defaults to `local-path` for k3s).

### 2. Install via Helm
```bash
# Set your kubeconfig context to the remote VPS
helm install platform ./charts/platform \
  --namespace platform \
  --create-namespace \
  -f charts/platform/values-prod.yaml
```

---

## 🧪 Verification & Usage logic

1.  **Create Store**:
    - Go to Dashboard -> **Create New Store**.
    - Select **Medusa**.
    - Status will cycle: `REQUESTED` -> `PROVISIONING` -> `READY`.

2.  **Access Store**:
    - Once `READY`, a link will appear: `http://<store-id>.localhost.nip.io` (Local) or `https://<store-id>.yourdomain.com` (Prod).
    - **Note for Local**: `.nip.io` domains resolve to `127.0.0.1`. Ensure your ingress controller is listening on localhost (Docker Desktop/k3d usually handles this).

3.  **Delete Store**:
    - Clicking **Delete** removes the Namespace, Deployment, PVCs, and Secrets.

---

## 📂 Project Structure

- `backend/`: Node.js Orchestrator & API.
- `dashboard/`: React + TypeScript UI.
- `charts/`: Helm charts.
    - `medusa-store/`: The "Tenant" chart deployed for each store.
    - `platform/`: (Optional) Chart for deploying the provisioner itself.
- `app.py`: automated runner script.

## 🔧 Troubleshooting

- **Stores stay in "PROVISIONING"**:
    - Check backend logs: `Are you logged into the cluster?`
    - Check pods: `kubectl get pods -n store-<id>`
    - Common issue: Images not pulled or pending PVCs.
- **"Cannot GET /store"**:
    - Check Ingress: `kubectl get ingress -n store-<id>`
- **Database Connection Error**:
    - Ensure `backend/.env` points to your local Metadata DB (not the tenant DBs).
