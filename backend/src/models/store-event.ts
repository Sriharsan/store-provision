import { getDatabase } from './database';
import { promisify } from 'util';
import { StoreStatus } from './store';

export interface StoreEvent {
  id: number;
  storeId: string;
  action: 'create' | 'delete' | 'provision' | 'ready' | 'fail';
  status: StoreStatus;
  message?: string;
  error?: string;
  timestamp: string;
}

export class StoreEventModel {
  private db = getDatabase();
  private get = promisify(this.db.get.bind(this.db));
  private all = promisify(this.db.all.bind(this.db));
  private run = promisify(this.db.run.bind(this.db));

  async create(event: Omit<StoreEvent, 'id' | 'timestamp'>): Promise<StoreEvent> {
    const result: any = await this.run(
      `INSERT INTO store_events (store_id, action, status, message, error)
       VALUES (?, ?, ?, ?, ?)`,
      [
        event.storeId,
        event.action,
        event.status,
        event.message || null,
        event.error || null
      ]
    );

    const row: any = await this.get('SELECT * FROM store_events WHERE id = ?', [result.lastID]);
    return {
      id: row.id,
      storeId: row.store_id,
      action: row.action,
      status: row.status,
      message: row.message,
      error: row.error,
      timestamp: row.timestamp
    };
  }

  async findByStoreId(storeId: string): Promise<StoreEvent[]> {
    const rows: any[] = await this.all(
      'SELECT * FROM store_events WHERE store_id = ? ORDER BY timestamp ASC',
      [storeId]
    );
    return rows.map(row => ({
      id: row.id,
      storeId: row.store_id,
      action: row.action,
      status: row.status,
      message: row.message,
      error: row.error,
      timestamp: row.timestamp
    }));
  }

  async findAll(limit: number = 100): Promise<StoreEvent[]> {
    const rows: any[] = await this.all(
      'SELECT * FROM store_events ORDER BY timestamp DESC LIMIT ?',
      [limit]
    );
    return rows.map(row => ({
      id: row.id,
      storeId: row.store_id,
      action: row.action,
      status: row.status,
      message: row.message,
      error: row.error,
      timestamp: row.timestamp
    }));
  }
}
