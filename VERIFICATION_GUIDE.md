# Verification Guide - Testing All Features

## Quick Verification Script

Run these commands to verify everything works:

```bash
# 1. Start platform (if not already running)
kubectl get pods -n platform

# 2. Create a test store via API
curl -X POST http://localhost:3001/api/stores \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Store","engine":"medusa"}'

# 3. Get store ID from response, then:
STORE_ID="<store-id-from-response>"

# 4. Verify namespace created
kubectl get namespace store-$STORE_ID

# 5. Verify ResourceQuota
kubectl get resourcequota -n store-$STORE_ID

# 6. Verify LimitRange
kubectl get limitrange -n store-$STORE_ID

# 7. Verify NetworkPolicy
kubectl get networkpolicy -n store-$STORE_ID

# 8. Verify all resources
kubectl get all -n store-$STORE_ID

# 9. Check metrics
curl http://localhost:3001/metrics

# 10. Check events
curl http://localhost:3001/api/events/store/$STORE_ID

# 11. Wait for store to be READY, then verify ingress
kubectl get ingress -n store-$STORE_ID

# 12. Test idempotency: Create store again with same name (should handle gracefully)

# 13. Test cleanup: Delete store
curl -X DELETE http://localhost:3001/api/stores/$STORE_ID

# 14. Verify namespace is deleted
kubectl get namespace store-$STORE_ID  # Should return "not found"
```

## Feature-by-Feature Verification

### 1. Kubernetes + Helm ✅

```bash
# Verify Helm chart structure
helm template test ./charts/medusa-store -f charts/medusa-store/values-local.yaml --set store.id=test123

# Check values files exist
ls charts/medusa-store/values-*.yaml
```

**Expected:** Both `values-local.yaml` and `values-prod.yaml` exist, Helm renders all resources.

### 2. Namespace Per Store ✅

```bash
# Create store via dashboard or API
# Then check:
kubectl get namespaces | grep store-

# Verify namespace contains all resources
kubectl get all -n store-<id>
```

**Expected:** Each store has its own namespace with all resources inside.

### 3. Medusa End-to-End ✅

```bash
# Wait for store to be READY
# Get ingress host
kubectl get ingress -n store-<id>

# Access storefront
curl http://<store-id>.localhost.nip.io

# Check Medusa health
curl http://<store-id>.localhost.nip.io/health
```

**Expected:** Storefront accessible, health endpoint returns 200.

### 4. Real Orchestrator ✅

```bash
# Check API logs
kubectl logs -n platform deployment/platform-api | grep -i provision

# Verify it uses Kubernetes API (not kubectl)
kubectl logs -n platform deployment/platform-api | grep -i "kubernetes\|helm"
```

**Expected:** Logs show Kubernetes API calls and Helm operations.

### 5. Dashboard Connected ✅

```bash
# Open dashboard
# Create store via UI
# Verify it appears in list
# Check browser network tab - should see API calls
```

**Expected:** Dashboard makes real API calls, shows live data.

### 6. Ingress + Stable URLs ✅

```bash
# Check ingress
kubectl get ingress -n store-<id> -o yaml

# Verify host matches pattern
kubectl get ingress -n store-<id> -o jsonpath='{.spec.rules[0].host}'
```

**Expected:** Host is `<store-id>.localhost.nip.io` (local) or `<store-id>.<domain>` (prod).

### 7. Persistence + Health Checks ✅

```bash
# Check PVC
kubectl get pvc -n store-<id>

# Check health probes
kubectl get deployment medusa-api -n store-<id> -o yaml | grep -A 10 readinessProbe
```

**Expected:** PVC exists, health probes configured.

### 8. Clean Teardown ✅

```bash
# Delete store
# Wait a few seconds
# Verify namespace gone
kubectl get namespace store-<id>  # Should error

# Verify PVC gone
kubectl get pvc -n store-<id>  # Should error (namespace doesn't exist)
```

**Expected:** Namespace and all resources deleted.

### 9. Idempotency ✅

```bash
# Create store
STORE_ID="test123"

# Kill API pod
kubectl delete pod -n platform -l app=platform-api

# Wait for pod to restart
kubectl wait --for=condition=ready pod -n platform -l app=platform-api --timeout=60s

# Check reconciliation logs
kubectl logs -n platform deployment/platform-api | grep -i reconcile

# Verify store still works (no duplicate resources)
kubectl get namespace store-$STORE_ID  # Should exist, not duplicated
```

**Expected:** System recovers, no duplicate resources.

### 10. Resource Limits ✅

```bash
# Check ResourceQuota
kubectl get resourcequota -n store-<id> -o yaml

# Check LimitRange
kubectl get limitrange -n store-<id> -o yaml

# Verify limits are set
kubectl describe resourcequota -n store-<id>
```

**Expected:** ResourceQuota and LimitRange exist with proper limits.

### 11. RBAC ✅

```bash
# Check ServiceAccount
kubectl get serviceaccount -n platform

# Check Role
kubectl get role -n platform

# Check ClusterRole
kubectl get clusterrole | grep store-provisioner

# Verify permissions
kubectl describe role store-provisioner -n platform
```

**Expected:** ServiceAccount, Role, ClusterRole exist with minimal permissions.

### 12. Production VPS Deployment ✅

```bash
# Check values-prod.yaml has production configs
cat charts/medusa-store/values-prod.yaml | grep -E "storageClass|domain|tls"

# Verify it's different from local
diff charts/medusa-store/values-local.yaml charts/medusa-store/values-prod.yaml
```

**Expected:** Production values differ from local (storage, domain, TLS).

### 13. Reconciliation Loop ✅

```bash
# Check reconciliation service is running
kubectl logs -n platform deployment/platform-api | grep -i "reconciliation\|reconcile"

# Manually delete a pod in a store namespace
kubectl delete pod -n store-<id> <pod-name>

# Wait 30 seconds
# Check if pod was recreated (reconciliation)
kubectl get pods -n store-<id>
```

**Expected:** Reconciliation logs visible, system self-heals.

### 14. Activity Log ✅

```bash
# Get events for a store
curl http://localhost:3001/api/events/store/<store-id>

# Check dashboard shows events timeline
# Open store detail page, verify events shown
```

**Expected:** Events API returns events, dashboard shows timeline.

### 15. Network Policies ✅

```bash
# Check NetworkPolicy exists
kubectl get networkpolicy -n store-<id>

# Verify it's deny-by-default
kubectl get networkpolicy -n store-<id> -o yaml | grep -A 5 "policyTypes"
```

**Expected:** NetworkPolicy exists, deny-by-default with specific allows.

### 16. Metrics ✅

```bash
# Check metrics endpoint
curl http://localhost:3001/metrics

# Should see:
# - provisioning_duration_seconds
# - provisioning_failures_total
# - stores_created_total
# - active_stores

# Check summary
curl http://localhost:3001/metrics/summary
```

**Expected:** Prometheus format metrics, summary JSON with stats.

---

## End-to-End Test Flow

1. **Start Platform:**
   ```bash
   kubectl get pods -n platform  # Should be running
   ```

2. **Create Store:**
   - Via dashboard: http://localhost:3000
   - Or API: `POST /api/stores`

3. **Watch Provisioning:**
   ```bash
   # Watch namespace creation
   watch kubectl get namespaces | grep store-

   # Watch pods
   kubectl get pods -n store-<id> -w

   # Watch events
   kubectl get events -n store-<id> -w
   ```

4. **Verify Store Ready:**
   - Check dashboard shows READY status
   - Verify ingress URL works
   - Access Medusa storefront

5. **Test Order Flow:**
   - Open storefront
   - Add product to cart
   - Complete checkout
   - Verify order exists

6. **Test Idempotency:**
   - Restart API pod
   - Verify store still works
   - No duplicate resources

7. **Test Cleanup:**
   - Delete store
   - Verify namespace deleted
   - Verify all resources gone

8. **Check Metrics:**
   ```bash
   curl http://localhost:3001/metrics | grep provisioning
   ```

---

## Common Issues & Fixes

### Issue: Store stuck in PROVISIONING
```bash
# Check logs
kubectl logs -n platform deployment/platform-api

# Check store events
curl http://localhost:3001/api/events/store/<store-id>

# Check Kubernetes events
kubectl get events -n store-<id>
```

### Issue: Metrics not showing
```bash
# Verify metrics endpoint
curl http://localhost:3001/metrics

# Check if metrics are being recorded
kubectl logs -n platform deployment/platform-api | grep -i metric
```

### Issue: NetworkPolicy blocking traffic
```bash
# Check NetworkPolicy
kubectl get networkpolicy -n store-<id> -o yaml

# Temporarily disable to test
# Edit values: networkPolicy.enabled: false
```

---

## ✅ All Features Verified

If all above checks pass, you have a fully working system with ALL required features!
