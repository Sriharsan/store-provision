import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class K8sService {
    /**
     * Check if a namespace exists
     */
    async namespaceExists(namespace: string): Promise<boolean> {
        try {
            await execAsync(`kubectl get namespace ${namespace}`);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Create a namespace
     */
    async createNamespace(namespace: string): Promise<void> {
        if (await this.namespaceExists(namespace)) return;
        await execAsync(`kubectl create namespace ${namespace}`);
    }

    /**
     * Delete a namespace
     */
    async deleteNamespace(namespace: string): Promise<void> {
        if (!(await this.namespaceExists(namespace))) return;
        await execAsync(`kubectl delete namespace ${namespace} --wait=false`);
    }

    /**
     * Check if a helm release exists
     */
    async releaseExists(releaseName: string, namespace: string): Promise<boolean> {
        try {
            await execAsync(`helm status ${releaseName} -n ${namespace}`);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Install a helm chart
     */
    async installHelmChart(releaseName: string, namespace: string, values: any): Promise<void> {
        // In a real app, we'd write values to a temp file. 
        // Here we'll pass critical ones via --set for simplicity, or assume a values file exists.
        // For this prototype, we'll assume the chart is in ../charts/medusa-store relative to backend root

        // We strictly use the local values for now
        const chartPath = '../charts/medusa-store';

        // Construct --set arguments from values object if needed, but for now we rely on values-local.yaml
        const cmd = `helm upgrade --install ${releaseName} ${chartPath} --namespace ${namespace} --create-namespace -f ${chartPath}/values-local.yaml --set store.id=${releaseName} --wait --timeout 5m`;

        console.log(`Executing: ${cmd}`);
        await execAsync(cmd);
    }

    /**
     * Uninstall a helm chart
     */
    async uninstallHelmChart(releaseName: string, namespace: string): Promise<void> {
        try {
            await execAsync(`helm uninstall ${releaseName} -n ${namespace}`);
        } catch (e) {
            // Ignore if already gone
        }
    }

    /**
     * Check if pods are ready in a namespace
     */
    async checkPodsReady(namespace: string): Promise<boolean> {
        try {
            // Check if all pods are running and ready
            const { stdout } = await execAsync(`kubectl get pods -n ${namespace} -o json`);
            const data = JSON.parse(stdout);

            if (!data.items || data.items.length === 0) return false;

            const allReady = data.items.every((pod: any) => {
                const phase = pod.status.phase;
                // Succeeded is fine for Jobs
                if (phase === 'Succeeded') return true;

                if (phase !== 'Running') return false;

                const containerStatuses = pod.status.containerStatuses || [];
                return containerStatuses.every((status: any) => status.ready);
            });

            return allReady;
        } catch (error) {
            console.error('Error checking pods:', error);
            return false;
        }
    }

    /**
     * Get Ingress Host
     */
    async getIngressHost(namespace: string): Promise<string | null> {
        try {
            const { stdout } = await execAsync(`kubectl get ingress -n ${namespace} -o json`);
            const data = JSON.parse(stdout);
            if (data.items && data.items.length > 0) {
                const rule = data.items[0].spec.rules[0];
                return rule.host;
            }
            return null;
        } catch (e) {
            return null;
        }
    }
}

export const k8sService = new K8sService();
