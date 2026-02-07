import { StoreModel, StoreStatus } from '../models/store';
import { Provisioner } from '../provisioning/provisioner';
import { logger } from '../utils/logger';
import { K8sClient } from '../k8s/k8s-client';

export class ReconciliationService {
  private storeModel: StoreModel;
  private provisioner: Provisioner;
  private k8sClient: K8sClient;
  private interval: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {
    this.storeModel = new StoreModel();
    this.provisioner = new Provisioner();
    this.k8sClient = new K8sClient();
  }

  start() {
    if (this.isRunning) {
      logger.warn('Reconciliation service already running');
      return;
    }

    this.isRunning = true;
    // Run reconciliation every 30 seconds
    this.interval = setInterval(() => {
      this.reconcile().catch(error => {
        logger.error('Reconciliation error:', error);
      });
    }, 30000);

    // Run immediately
    this.reconcile().catch(error => {
      logger.error('Initial reconciliation error:', error);
    });

    logger.info('Reconciliation service started');
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    logger.info('Reconciliation service stopped');
  }

  private async reconcile(): Promise<void> {
    try {
      // Reconcile stores in PROVISIONING state
      const provisioningStores = await this.storeModel.findByStatus(StoreStatus.PROVISIONING);
      for (const store of provisioningStores) {
        await this.reconcileStore(store.id);
      }

      // Reconcile stores in DELETING state
      const deletingStores = await this.storeModel.findByStatus(StoreStatus.DELETING);
      for (const store of deletingStores) {
        await this.reconcileDeletion(store.id);
      }
    } catch (error) {
      logger.error('Reconciliation failed:', error);
    }
  }

  private async reconcileStore(storeId: string): Promise<void> {
    const store = await this.storeModel.findById(storeId);
    if (!store) {
      return;
    }

    try {
      // Check if namespace exists
      const namespaceExists = await this.k8sClient.namespaceExists(store.namespace);
      
      if (!namespaceExists) {
        // Namespace doesn't exist, recreate it
        logger.info(`Reconciling: namespace ${store.namespace} missing, recreating`);
        await this.provisioner.provisionStore(storeId);
        return;
      }

      // Check if deployment is ready
      const isReady = await this.k8sClient.isDeploymentReady('medusa-api', store.namespace);
      
      if (isReady && store.status !== StoreStatus.READY) {
        // Deployment is ready but store status is not READY, update status
        const url = await this.k8sClient.getIngressHost('medusa-ingress', store.namespace);
        await this.storeModel.updateStatus(storeId, StoreStatus.READY, undefined, url || undefined);
        logger.info(`Reconciled: store ${storeId} is now READY`);
      } else if (!isReady && store.status === StoreStatus.READY) {
        // Deployment is not ready but store status is READY, mark as PROVISIONING
        await this.storeModel.updateStatus(storeId, StoreStatus.PROVISIONING);
        logger.warn(`Reconciled: store ${storeId} deployment not ready, marking as PROVISIONING`);
      }
    } catch (error: any) {
      logger.error(`Reconciliation failed for store ${storeId}:`, error);
      await this.storeModel.updateStatus(
        storeId,
        StoreStatus.FAILED,
        `Reconciliation error: ${error.message}`
      );
    }
  }

  private async reconcileDeletion(storeId: string): Promise<void> {
    const store = await this.storeModel.findById(storeId);
    if (!store) {
      return;
    }

    try {
      // Check if namespace still exists
      const namespaceExists = await this.k8sClient.namespaceExists(store.namespace);
      
      if (!namespaceExists) {
        // Namespace is gone, remove from database
        await this.storeModel.delete(storeId);
        logger.info(`Reconciled: store ${storeId} deletion complete`);
      } else {
        // Namespace still exists, try to delete again
        logger.info(`Reconciling: namespace ${store.namespace} still exists, deleting`);
        await this.provisioner.deleteStore(storeId);
      }
    } catch (error: any) {
      logger.error(`Deletion reconciliation failed for store ${storeId}:`, error);
    }
  }
}
