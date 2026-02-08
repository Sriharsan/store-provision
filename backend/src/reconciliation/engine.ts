import prisma from '../prisma';
import { k8sService } from '../services/k8sService';
import axios from 'axios';

const LOOP_INTERVAL_MS = 5000;

export class ReconciliationEngine {
    private isRunning = false;

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log('🔄 Reconciliation Engine started');
        this.loop();
    }

    private async loop() {
        while (this.isRunning) {
            try {
                await this.reconcile();
            } catch (error) {
                console.error('❌ Reconciliation loop error:', error);
            }
            await new Promise((resolve) => setTimeout(resolve, LOOP_INTERVAL_MS));
        }
    }

    private async reconcile() {
        // Find stores that need attention
        const stores = await prisma.store.findMany({
            where: {
                status: {
                    in: ['REQUESTED', 'PROVISIONING', 'DELETING']
                }
            }
        });

        for (const store of stores) {
            const namespace = `store-${store.id}`;

            try {
                if (store.status === 'REQUESTED') {
                    await this.handleRequested(store, namespace);
                } else if (store.status === 'PROVISIONING') {
                    await this.handleProvisioning(store, namespace);
                } else if (store.status === 'DELETING') {
                    await this.handleDeleting(store, namespace);
                }
            } catch (error: any) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(`❌ Error processing store ${store.id}:`, errorMessage);
                if (error?.response?.body) {
                    console.error('   K8s API Error Body:', JSON.stringify(error.response.body, null, 2));
                }

                await this.logEvent(store.id, 'failed', 'FAILED', errorMessage);
                await prisma.store.update({
                    where: { id: store.id },
                    data: { status: 'FAILED', errorMessage: error.message }
                });
            }
        }
    }

    private async handleRequested(store: any, namespace: string) {
        console.log(`🛠️ Processing REQUESTED store: ${store.id}`);

        // Update status to provisioning immediately to avoid double processing
        await prisma.store.update({
            where: { id: store.id },
            data: { status: 'PROVISIONING' }
        });
        await this.logEvent(store.id, 'provisioning', 'PROVISIONING', 'Starting provisioning process');

        // Create Namespace
        await k8sService.createNamespace(namespace);

        // Install Helm Chart
        // In a real scenario, we would parse store.template/engine to choose chart
        await k8sService.installHelmChart(`medusa-${store.id}`, namespace, {});

        await this.logEvent(store.id, 'provisioning', 'PROVISIONING', 'Helm release installed, waiting for pods');
    }


    private async handleProvisioning(store: any, namespace: string) {
        // 1. Check for Timeout (15 minutes)
        const timeoutLimit = 15 * 60 * 1000;
        const elapsed = Date.now() - new Date(store.createdAt).getTime();

        if (elapsed > timeoutLimit) {
            console.error(`❌ Store ${store.id} timed out during provisioning`);
            await this.handleFailure(store, 'Provisioning timed out after 15 minutes. Infrastructure readiness check failed.');
            return;
        }

        // 2. Check Pod Readiness
        const podsReady = await k8sService.checkPodsReady(namespace);
        if (!podsReady) return; // Wait for next loop

        // 3. Check Ingress/Storefront Availability (Hard Ready Contract)
        const host = await k8sService.getIngressHost(namespace);
        const url = host ? `http://${host}` : null;

        if (!url) return; // Wait for Ingress to be assigned

        try {
            // Check Storefront Health (assuming root returns 200)
            // We can also check /health if Medusa exposes it on the ingress, but usually / works for storefront
            await axios.get(url, { timeout: 2000 });
            console.log(`✅ Store ${store.id} is READY (Pods + HTTP 200)`);

            await prisma.store.update({
                where: { id: store.id },
                data: { status: 'READY', url: url }
            });

            await this.logEvent(store.id, 'ready', 'READY', `Store is fully ready at ${url}`);
        } catch (error) {
            console.log(`⏳ Store ${store.id} pods ready, but expecting HTTP 200 from ${url}...`);
            // Do not fail yet, just wait for traffic to flow
        }
    }

    private async handleFailure(store: any, reason: string) {
        await this.logEvent(store.id, 'failed', 'FAILED', reason);
        await prisma.store.update({
            where: { id: store.id },
            data: { status: 'FAILED', errorMessage: reason }
        });
    }

    private async handleDeleting(store: any, namespace: string) {
        console.log(`🗑️ Deleting store ${store.id}`);

        // 1. Ensure deletion is triggered (Idempotent)
        // We use --wait=false so this returns immediately
        await k8sService.uninstallHelmChart(`medusa-${store.id}`, namespace);
        await k8sService.deleteNamespace(namespace);

        // 2. Check if namespace still exists
        const exists = await k8sService.namespaceExists(namespace);

        if (exists) {
            console.log(`⏳ Namespace ${namespace} still terminating...`);
            // Do NOT update status to DELETED yet.
            // Return and let the next loop check again.
            return;
        }

        // 3. Namespace is gone -> Update DB
        console.log(`✅ Namespace ${namespace} deleted. Updating DB.`);
        await prisma.store.update({
            where: { id: store.id },
            data: { status: 'DELETED' }
        });

        await this.logEvent(store.id, 'deleted', 'DELETED', 'Store resources removed');
    }

    private async logEvent(storeId: string, action: string, status: string, message: string) {
        await prisma.storeEvent.create({
            data: {
                storeId,
                action,
                status,
                message
            }
        });
    }
}

export const reconciliationEngine = new ReconciliationEngine();
