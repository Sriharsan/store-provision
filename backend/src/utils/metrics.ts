// Simple Prometheus-style metrics
// In production, use prom-client library

interface Metric {
  name: string;
  type: 'counter' | 'histogram' | 'gauge';
  value: number;
  labels?: Record<string, string>;
}

class MetricsCollector {
  private metrics: Map<string, Metric[]> = new Map();

  // Counter: provisioning_failures_total
  incrementProvisioningFailures(storeId: string, reason?: string): void {
    const key = 'provisioning_failures_total';
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    const metric: Metric = {
      name: key,
      type: 'counter',
      value: 1,
      labels: {
        store_id: storeId,
        reason: reason || 'unknown'
      }
    };
    this.metrics.get(key)!.push(metric);
  }

  // Histogram: provisioning_duration_seconds
  recordProvisioningDuration(storeId: string, durationSeconds: number): void {
    const key = 'provisioning_duration_seconds';
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    const metric: Metric = {
      name: key,
      type: 'histogram',
      value: durationSeconds,
      labels: {
        store_id: storeId
      }
    };
    this.metrics.get(key)!.push(metric);
  }

  // Counter: stores_created_total
  incrementStoresCreated(engine: string): void {
    const key = 'stores_created_total';
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    const metric: Metric = {
      name: key,
      type: 'counter',
      value: 1,
      labels: {
        engine
      }
    };
    this.metrics.get(key)!.push(metric);
  }

  // Gauge: active_stores
  setActiveStores(count: number): void {
    const key = 'active_stores';
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    // Keep only latest value for gauge
    this.metrics.set(key, [{
      name: key,
      type: 'gauge',
      value: count
    }]);
  }

  // Get metrics in Prometheus format
  getPrometheusFormat(): string {
    const lines: string[] = [];
    
    for (const [key, metrics] of this.metrics.entries()) {
      // Group by labels
      const grouped = new Map<string, number>();
      
      for (const metric of metrics) {
        const labelStr = metric.labels 
          ? '{' + Object.entries(metric.labels).map(([k, v]) => `${k}="${v}"`).join(',') + '}'
          : '';
        const fullKey = `${metric.name}${labelStr}`;
        
        if (metric.type === 'counter' || metric.type === 'gauge') {
          grouped.set(fullKey, (grouped.get(fullKey) || 0) + metric.value);
        } else if (metric.type === 'histogram') {
          // For histogram, we'll use buckets
          const bucket = this.getBucket(metric.value);
          const bucketKey = `${metric.name}_bucket${labelStr}{le="${bucket}"}`;
          grouped.set(bucketKey, (grouped.get(bucketKey) || 0) + 1);
          // Also add sum
          const sumKey = `${metric.name}_sum${labelStr}`;
          grouped.set(sumKey, (grouped.get(sumKey) || 0) + metric.value);
          // Add count
          const countKey = `${metric.name}_count${labelStr}`;
          grouped.set(countKey, (grouped.get(countKey) || 0) + 1);
        }
      }
      
      for (const [fullKey, value] of grouped.entries()) {
        lines.push(`${fullKey} ${value}`);
      }
    }
    
    return lines.join('\n') + '\n';
  }

  private getBucket(value: number): string {
    // Histogram buckets: 10s, 30s, 60s, 120s, 300s, 600s, +Inf
    const buckets = [10, 30, 60, 120, 300, 600, Infinity];
    for (const bucket of buckets) {
      if (value <= bucket) {
        return bucket === Infinity ? '+Inf' : bucket.toString();
      }
    }
    return '+Inf';
  }

  // Get summary stats
  getSummary(): {
    totalStoresCreated: number;
    totalFailures: number;
    avgProvisioningDuration: number;
    activeStores: number;
  } {
    const storesCreated = this.metrics.get('stores_created_total')?.length || 0;
    const failures = this.metrics.get('provisioning_failures_total')?.length || 0;
    const durations = this.metrics.get('provisioning_duration_seconds') || [];
    const avgDuration = durations.length > 0
      ? durations.reduce((sum, m) => sum + m.value, 0) / durations.length
      : 0;
    const activeStores = this.metrics.get('active_stores')?.[0]?.value || 0;

    return {
      totalStoresCreated: storesCreated,
      totalFailures: failures,
      avgProvisioningDuration: avgDuration,
      activeStores: activeStores
    };
  }
}

export const metrics = new MetricsCollector();
