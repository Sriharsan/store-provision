# System Design & Tradeoffs

## Architecture Choice

### Control Plane Pattern

We model stores as **Custom Resources** conceptually, even though we implement reconciliation using Helm for simplicity. This provides:

- **Desired vs Actual State**: System continuously reconciles until desired state matches actual
- **Idempotency**: Safe to retry operations, no duplicate resources
- **Self-healing**: If resources are manually deleted, system recreates them
- **Observability**: Clear state transitions and failure reasons

### Why Helm Instead of CRDs?

**Tradeoff**: We use Helm for deployment instead of full Kubernetes CRDs because:
- ✅ Faster to implement (meets deadline)
- ✅ Same conceptual model (stores as resources)
- ✅ Helm is production-proven
- ✅ Easier to debug and understand
- ⚠️ Less "native" than CRDs, but sufficient for Round 1

**Future**: Could migrate to CRDs + Operator pattern for Round 2.

## Idempotency & Failure Handling

### State Machine

```
REQUESTED → PROVISIONING → READY
                ↓
             FAILED
                ↓
            DELETING
```

### Reconciliation Loop

Background worker polls all stores and compares:
1. **Database state** (desired)
2. **Kubernetes state** (actual)

If mismatch detected:
- Namespace missing → create namespace
- Helm release missing → install Helm chart
- Pods not ready → wait or fail with reason
- Ingress missing → create ingress

### Crash Recovery

If provisioning engine crashes mid-provisioning:
1. On restart, checks existing namespace
2. Checks Helm release status
3. If partially provisioned, resumes from last known state
4. If failed, marks store as FAILED with error reason

### Cleanup Guarantees

Deletion flow:
1. Mark store as DELETING
2. Helm uninstall (removes all resources)
3. Delete namespace (removes any orphaned resources)
4. Delete PVC (guarantees data wipe)
5. Remove from database

**Guarantee**: No orphaned resources remain after deletion.

## Production Considerations

### What Changes Between Local and Production

| Component | Local | Production |
|-----------|-------|------------|
| **Ingress** | `.localhost.nip.io` | Real domain + TLS |
| **Storage** | `hostPath` or `local-path` | Cloud storage class |
| **Secrets** | Generated per store | From Vault/Secrets Manager |
| **Resource Limits** | Lower (dev) | Higher (prod) |
| **Monitoring** | Basic logs | Prometheus + Grafana |
| **TLS** | None | cert-manager + Let's Encrypt |

### DNS Strategy

- **Local**: `nip.io` wildcard DNS (no setup needed)
- **Production**: Configure DNS to point `*.yourdomain.com` to ingress IP
- **TLS**: cert-manager with Let's Encrypt for automatic certificates

### Storage Strategy

- **Local**: `local-path` provisioner (k3d/kind default)
- **Production**: Cloud storage class (AWS EBS, GCP Persistent Disk)
- **PVC Size**: Limited per store via ResourceQuota (default: 5Gi)

### Secret Management

- **Local**: Kubernetes Secrets generated per store
- **Production**: External secrets operator or Vault integration
- **No hardcoded secrets**: All secrets generated or fetched from secure store

### Scaling Plan

#### Horizontal Scaling

**Platform Components** (stateless):
- API: Scales horizontally (multiple replicas)
- Dashboard: Scales horizontally (CDN + multiple replicas)
- Provisioning Engine: Can scale, but use leader election for reconciliation

**Store Components** (stateful):
- Medusa API: Scales horizontally (stateless, connects to shared DB)
- PostgreSQL: Single instance per store (StatefulSet)

#### Provisioning Throughput

- **Concurrency Control**: Max 5 concurrent provisioning operations
- **Queue System**: Stores queued if limit reached
- **Timeout**: 10 minutes per provisioning operation

#### Stateful Constraints

- **PostgreSQL**: One per store, cannot scale horizontally
- **PVC**: Bound to node, requires careful node management
- **Solution**: Use managed databases (RDS, Cloud SQL) in production

## Security Posture

### RBAC

Provisioning engine uses ServiceAccount with minimal permissions:
- Create/delete namespaces
- Install/uninstall Helm releases
- Read deployment status
- Create/delete secrets

**Principle**: Least privilege - only what's needed for provisioning.

### Network Policies

Per-store namespace has deny-by-default NetworkPolicy:
- Allows ingress from ingress controller
- Allows egress to DNS
- Allows Medusa → PostgreSQL communication
- Blocks all other traffic

### Container Hardening

- Run containers as non-root user (where possible)
- Read-only root filesystem (where applicable)
- Drop all capabilities except required ones
- Security contexts configured per pod

### Secret Handling

- Secrets generated per store (unique DB passwords)
- Never logged or exposed in API responses
- Rotated on store update (if implemented)

## Abuse Prevention

### Rate Limiting

- **Per IP**: 10 store creations per hour
- **Per User**: 5 stores per user (if auth implemented)
- **Global**: 20 concurrent provisioning operations

### Blast Radius Controls

- **Max Stores**: Configurable limit (default: 100)
- **Max Resources**: ResourceQuota per store
- **Timeouts**: 10 min provisioning timeout
- **Resource Limits**: CPU/memory limits per store

### Audit Trail

All actions logged:
- Store created/deleted
- Provisioning started/completed/failed
- User/IP address (if available)
- Timestamp and error messages

## Observability

### Store Events Timeline

Each store maintains event log:
```
[12:01:00] Store requested
[12:01:05] Namespace created
[12:01:10] PostgreSQL PVC created
[12:01:15] PostgreSQL pod ready
[12:01:20] Medusa deployment created
[12:01:45] Medusa pod ready
[12:01:50] Ingress created
[12:02:00] Store READY
```

### Metrics (Future)

- Stores created per hour
- Provisioning duration (p50, p95, p99)
- Provisioning failure rate
- Active stores count
- Resource utilization per store

### Failure Reporting

When provisioning fails:
- Clear error message in UI
- Event log shows failure point
- Kubernetes events captured
- Reason surfaced: "PostgreSQL pod failed to start: ImagePullBackOff"

## Upgrade & Rollback Story

### Helm Upgrades

```bash
# Upgrade store version
helm upgrade store-abc ./charts/medusa-store \
  --namespace store-abc \
  --set image.tag=v2.0.0 \
  -f values-prod.yaml

# Rollback if issues
helm rollback store-abc --namespace store-abc
```

### Platform Upgrades

```bash
# Upgrade platform
helm upgrade platform ./charts/platform \
  -f values-prod.yaml \
  --set image.tag=v2.0.0

# Rollback
helm rollback platform
```

### Zero-Downtime Strategy

- **Medusa**: Rolling updates (Deployment strategy)
- **PostgreSQL**: StatefulSet with careful upgrade process
- **Platform**: Blue-green deployment (future)

## Tradeoffs Made

1. **Helm vs CRDs**: Chose Helm for speed, CRDs would be more "native"
2. **Single PostgreSQL per store**: Simpler, but doesn't scale horizontally
3. **Synchronous provisioning**: Could be async with webhooks, but simpler for Round 1
4. **Basic auth**: No full auth system, just basic for demo
5. **Local storage**: Production should use cloud storage classes

## Future Enhancements (Round 2+)

- Full Kubernetes CRD implementation
- Async provisioning with webhooks
- Multi-region support
- Advanced monitoring (Prometheus/Grafana)
- Managed database option (RDS, Cloud SQL)
- Store templates marketplace
- Custom domain support
- Backup/restore functionality
