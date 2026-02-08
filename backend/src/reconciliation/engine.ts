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

                await this.logEvent(store.id, 'failed', 'FAILED', errorMessage);

                await prisma.store.update({
                    where: { id: store.id },
                    data: {
                        status: 'FAILED',
                        errorMessage
                    }
                });
            }
        }
    }

    private async handleRequested(store: any, namespace: string) {

        console.log(`🛠️ Processing REQUESTED store: ${store.id}`);

        await prisma.store.update({
            where: { id: store.id },
            data: { status: 'PROVISIONING' }
        });

        await this.logEvent(store.id, 'provisioning', 'PROVISIONING', 'Starting provisioning');

        await k8sService.createNamespace(namespace);

        await k8sService.installHelmChart(
            `medusa-${store.id}`,
            namespace,
            {}
        );

        await this.logEvent(store.id, 'provisioning', 'PROVISIONING', 'Helm installed');
    }

    private async handleProvisioning(store: any, namespace: string) {

        // timeout guard
        const timeoutLimit = 15 * 60 * 1000;
        const elapsed = Date.now() - new Date(store.createdAt).getTime();

        if (elapsed > timeoutLimit) {
            await this.handleFailure(store, 'Provision timeout');
            return;
        }

        // check pod readiness
        const podsReady = await k8sService.checkPodsReady(namespace);

        if (!podsReady) {
            console.log(`⏳ Waiting for pods in ${namespace}`);
            return;
        }

        console.log(`✅ Pods ready for ${store.id}`);

        // OPTIONAL ingress check (non-blocking)
        let url: string | null = null;

        try {
            const host = await k8sService.getIngressHost(namespace);

            if (host) {
                url = `http://${host}`;
                await axios.get(url, { timeout: 2000 });
                console.log(`🌐 Ingress reachable at ${url}`);
            }
        } catch {
            console.log(`⚠️ Ingress not ready yet (allowed)`);
        }

        // mark READY regardless of ingress
        await prisma.store.update({
            where: { id: store.id },
            data: {
                status: 'READY',
                url: url || `namespace://${namespace}`
            }
        });

        await this.logEvent(
            store.id,
            'ready',
            'READY',
            `Infrastructure ready`
        );
    }

    private async handleDeleting(store: any, namespace: string) {

        console.log(`🗑️ Deleting ${store.id}`);

        await k8sService.uninstallHelmChart(
            `medusa-${store.id}`,
            namespace
        );

        await k8sService.deleteNamespace(namespace);

        const exists = await k8sService.namespaceExists(namespace);

        if (exists) return;

        await prisma.store.update({
            where: { id: store.id },
            data: { status: 'DELETED' }
        });

        await this.logEvent(store.id, 'deleted', 'DELETED', 'Removed');
    }

    private async handleFailure(store: any, reason: string) {

        await this.logEvent(store.id, 'failed', 'FAILED', reason);

        await prisma.store.update({
            where: { id: store.id },
            data: {
                status: 'FAILED',
                errorMessage: reason
            }
        });
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
