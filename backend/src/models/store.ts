import { getDatabase } from './database';
import { promisify } from 'util';

export enum StoreStatus {
  REQUESTED = 'REQUESTED',
  PROVISIONING = 'PROVISIONING',
  READY = 'READY',
  FAILED = 'FAILED',
  DELETING = 'DELETING'
}

export interface Store {
  id: string;
  name: string;
  engine: 'medusa' | 'woocommerce';
  template?: string;
  status: StoreStatus;
  url?: string;
  namespace: string;
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
}

export interface StoreSpec {
  storeId: string;
  engine: string;
  resources: {
    cpu: string;
    memory: string;
    storage: string;
  };
  template?: string;
}

export class StoreModel {
  private db = getDatabase();
  private get = promisify(this.db.get.bind(this.db));
  private all = promisify(this.db.all.bind(this.db));
  private run = promisify(this.db.run.bind(this.db));

  async create(store: Omit<Store, 'createdAt' | 'updatedAt'>): Promise<Store> {
    await this.run(
      `INSERT INTO stores (id, name, engine, template, status, url, namespace, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        store.id,
        store.name,
        store.engine,
        store.template || null,
        store.status,
        store.url || null,
        store.namespace,
        store.errorMessage || null
      ]
    );

    return this.findById(store.id);
  }

  async findById(id: string): Promise<Store | null> {
    const row: any = await this.get('SELECT * FROM stores WHERE id = ?', [id]);
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      engine: row.engine,
      template: row.template,
      status: row.status as StoreStatus,
      url: row.url,
      namespace: row.namespace,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      errorMessage: row.error_message
    };
  }

  async findAll(): Promise<Store[]> {
    const rows: any[] = await this.all('SELECT * FROM stores ORDER BY created_at DESC');
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      engine: row.engine,
      template: row.template,
      status: row.status as StoreStatus,
      url: row.url,
      namespace: row.namespace,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      errorMessage: row.error_message
    }));
  }

  async updateStatus(id: string, status: StoreStatus, errorMessage?: string, url?: string): Promise<void> {
    await this.run(
      `UPDATE stores 
       SET status = ?, error_message = ?, url = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, errorMessage || null, url || null, id]
    );
  }

  async delete(id: string): Promise<void> {
    await this.run('DELETE FROM stores WHERE id = ?', [id]);
  }

  async findByStatus(status: StoreStatus): Promise<Store[]> {
    const rows: any[] = await this.all('SELECT * FROM stores WHERE status = ?', [status]);
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      engine: row.engine,
      template: row.template,
      status: row.status as StoreStatus,
      url: row.url,
      namespace: row.namespace,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      errorMessage: row.error_message
    }));
  }
}
