# Quick Start Guide

## 5-Minute Local Setup

```bash
# 1. Create cluster
k3d cluster create store-provisioning --port "8080:80@loadbalancer" --wait

# 2. Build and load images
docker build -t store-provisioning-api:latest ./backend
docker build -t store-provisioning-dashboard:latest ./dashboard
k3d image import store-provisioning-api:latest -c store-provisioning
k3d image import store-provisioning-dashboard:latest -c store-provisioning

# 3. Install platform
kubectl create namespace platform
helm install platform ./charts/platform \
  --namespace platform \
  -f charts/platform/values-local.yaml \
  --set api.image.repository=store-provisioning-api \
  --set dashboard.image.repository=store-provisioning-dashboard

# 4. Wait for ready
kubectl wait --for=condition=available --timeout=300s deployment/platform-api -n platform

# 5. Access dashboard
kubectl port-forward -n platform svc/platform-dashboard 3000:80
# Open http://localhost:3000
```

## Create Your First Store

1. Open http://localhost:3000
2. Click "Create New Store"
3. Enter name: "My First Store"
4. Select engine: Medusa
5. Click "Create Store"
6. Watch the events timeline as it provisions
7. When status is READY, click the store URL
8. Test placing an order!

## Verify Everything Works

```bash
# Check platform is running
kubectl get pods -n platform

# Check stores
kubectl get namespaces | grep store-

# Check a specific store
STORE_ID="your-store-id"
kubectl get all -n store-$STORE_ID

# View store events in dashboard or:
kubectl get events -n store-$STORE_ID
```

## Clean Up

```bash
# Delete all stores (via dashboard or API)
# Then delete platform
helm uninstall platform -n platform
k3d cluster delete store-provisioning
```
