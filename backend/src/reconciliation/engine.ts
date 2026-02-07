import prisma from '../prisma';
import { k8sService } from '../services/k8sService';

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
                console.error(`❌ Error processing store ${store.id}:`, error);
                await this.logEvent(store.id, 'failed', 'FAILED', error.message || 'Unknown error');
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
        // Check if ready
        const ready = await k8sService.checkPodsReady(namespace);

        if (ready) {
            console.log(`✅ Store ${store.id} is READY`);

            const host = await k8sService.getIngressHost(namespace);
            const url = host ? `http://${host}` : null;

            await prisma.store.update({
                where: { id: store.id },
                data: { status: 'READY', url: url }
            });

            await this.logEvent(store.id, 'ready', 'READY', `Store is ready at ${url}`);
        } else {
            // Still initializing, maybe check for timeout here?
            // For now, just wait for next loop
        }
    }

    private async handleDeleting(store: any, namespace: string) {
        console.log(`🗑️ Deleting store ${store.id}`);

        await k8sService.uninstallHelmChart(`medusa-${store.id}`, namespace);
        await k8sService.deleteNamespace(namespace);

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
