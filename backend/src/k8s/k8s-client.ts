import * as k8s from '@kubernetes/client-node';
import { logger } from '../utils/logger';

export class K8sClient {
  private k8sApi: k8s.CoreV1Api;
  private appsApi: k8s.AppsV1Api;
  private networkingApi: k8s.NetworkingV1Api;
  private kc: k8s.KubeConfig;

  constructor() {
    this.kc = new k8s.KubeConfig();
    this.kc.loadFromDefault();
    
    this.k8sApi = this.kc.makeApiClient(k8s.CoreV1Api);
    this.appsApi = this.kc.makeApiClient(k8s.AppsV1Api);
    this.networkingApi = this.kc.makeApiClient(k8s.NetworkingV1Api);
  }

  async namespaceExists(name: string): Promise<boolean> {
    try {
      await this.k8sApi.readNamespace(name);
      return true;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  async createNamespace(name: string): Promise<void> {
    const namespace: k8s.V1Namespace = {
      metadata: {
        name,
        labels: {
          'app': 'store-provisioning-platform',
          'managed-by': 'store-provisioning-platform'
        }
      }
    };

    try {
      await this.k8sApi.createNamespace(namespace);
      logger.info(`Namespace ${name} created`);
    } catch (error: any) {
      if (error.statusCode === 409) {
        // Namespace already exists, that's okay (idempotency)
        logger.info(`Namespace ${name} already exists`);
        return;
      }
      throw error;
    }
  }

  async deleteNamespace(name: string): Promise<void> {
    try {
      await this.k8sApi.deleteNamespace(name);
      logger.info(`Namespace ${name} deleted`);
    } catch (error: any) {
      if (error.statusCode === 404) {
        // Namespace doesn't exist, that's okay (idempotency)
        logger.info(`Namespace ${name} doesn't exist`);
        return;
      }
      throw error;
    }
  }

  async isDeploymentReady(name: string, namespace: string): Promise<boolean> {
    try {
      const deployment = await this.appsApi.readNamespacedDeployment(name, namespace);
      
      if (!deployment.body.status) {
        return false;
      }

      const { replicas, readyReplicas, availableReplicas } = deployment.body.status;
      
      return (
        replicas !== undefined &&
        readyReplicas === replicas &&
        availableReplicas === replicas &&
        replicas > 0
      );
    } catch (error: any) {
      if (error.statusCode === 404) {
        return false;
      }
      logger.error(`Error checking deployment ${name}:`, error);
      return false;
    }
  }

  async getIngressHost(name: string, namespace: string): Promise<string | null> {
    try {
      const ingress = await this.networkingApi.readNamespacedIngress(name, namespace);
      
      if (ingress.body.spec?.rules && ingress.body.spec.rules.length > 0) {
        return ingress.body.spec.rules[0].host || null;
      }
      return null;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null;
      }
      logger.error(`Error getting ingress ${name}:`, error);
      return null;
    }
  }
}
