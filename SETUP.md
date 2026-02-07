# Setup Instructions

## Prerequisites

- Docker Desktop (for k3d/kind) or k3s installed
- kubectl configured
- Helm 3.x installed
- Node.js 18+ (for local development)
- Git

## Local Development Setup

### 1. Create Kubernetes Cluster

```bash
# Option 1: Using k3d (recommended)
k3d cluster create store-provisioning --port "8080:80@loadbalancer" --wait

# Option 2: Using kind
kind create cluster --name store-provisioning

# Verify cluster is running
kubectl cluster-info
```

### 2. Install Ingress Controller

```bash
# For k3d (already included)
# For kind, install nginx ingress:
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# Wait for ingress to be ready
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s
```

### 3. Build Docker Images

```bash
# Build backend API
cd backend
docker build -t store-provisioning-api:latest .

# Build dashboard
cd ../dashboard
docker build -t store-provisioning-dashboard:latest .

cd ..
```

### 4. Load Images into Cluster

```bash
# For k3d
k3d image import store-provisioning-api:latest -c store-provisioning
k3d image import store-provisioning-dashboard:latest -c store-provisioning

# For kind
kind load docker-image store-provisioning-api:latest --name store-provisioning
kind load docker-image store-provisioning-dashboard:latest --name store-provisioning
```

### 5. Install Platform

```bash
# Create namespace
kubectl create namespace platform

# Install platform components
helm install platform ./charts/platform \
  --namespace platform \
  -f charts/platform/values-local.yaml \
  --set api.image.repository=store-provisioning-api \
  --set api.image.tag=latest \
  --set dashboard.image.repository=store-provisioning-dashboard \
  --set dashboard.image.tag=latest

# Wait for platform to be ready
kubectl wait --for=condition=available --timeout=300s deployment/platform-api -n platform
kubectl wait --for=condition=available --timeout=300s deployment/platform-dashboard -n platform
```

### 6. Access Dashboard

```bash
# Port forward to access dashboard
kubectl port-forward -n platform svc/platform-dashboard 3000:80

# Or access via ingress (if configured)
# http://platform.localhost.nip.io
```

### 7. Test Store Creation

1. Open dashboard at http://localhost:3000
2. Click "Create New Store"
3. Enter store name and select Medusa
4. Wait for provisioning (watch events timeline)
5. Access store at `<store-id>.localhost.nip.io`

## Production Deployment (k3s on VPS)

### 1. Install k3s

```bash
curl -sfL https://get.k3s.io | sh -
sudo kubectl get nodes
```

### 2. Configure kubectl

```bash
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
sudo chmod 644 /etc/rancher/k3s/k3s.yaml
```

### 3. Install Ingress Controller

k3s includes Traefik by default. For nginx:

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
```

### 4. Push Images to Registry

```bash
# Tag images
docker tag store-provisioning-api:latest your-registry/store-provisioning-api:v1.0.0
docker tag store-provisioning-dashboard:latest your-registry/store-provisioning-dashboard:v1.0.0

# Push to registry
docker push your-registry/store-provisioning-api:v1.0.0
docker push your-registry/store-provisioning-dashboard:v1.0.0
```

### 5. Update values-prod.yaml

Edit `charts/platform/values-prod.yaml`:
- Set your domain
- Update image repository
- Configure TLS (cert-manager)

### 6. Install Platform

```bash
helm install platform ./charts/platform \
  --namespace platform \
  --create-namespace \
  -f charts/platform/values-prod.yaml
```

## Troubleshooting

### Check Platform Logs

```bash
# API logs
kubectl logs -n platform deployment/platform-api

# Dashboard logs
kubectl logs -n platform deployment/platform-dashboard
```

### Check Store Resources

```bash
# List all stores
kubectl get namespaces | grep store-

# Check specific store
kubectl get all -n store-<store-id>

# Check store events
kubectl get events -n store-<store-id>
```

### Common Issues

1. **Images not found**: Make sure images are loaded into cluster
2. **Ingress not working**: Check ingress controller is running
3. **Provisioning fails**: Check API logs and Kubernetes events
4. **Database connection issues**: Verify PostgreSQL pod is ready

## Development Mode

For local development without Docker:

```bash
# Backend
cd backend
npm install
npm run dev

# Dashboard (in another terminal)
cd dashboard
npm install
npm run dev
```

Then access:
- API: http://localhost:3001
- Dashboard: http://localhost:3000
