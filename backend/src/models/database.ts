import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

const DB_PATH = process.env.DB_PATH || './data/stores.db';

let db: sqlite3.Database;

export async function initDatabase() {
  if (DB_PATH !== ':memory:') {
    try {
      const dbDir = path.dirname(DB_PATH);
      if (dbDir && dbDir !== '.') {
        fs.mkdirSync(dbDir, { recursive: true });
      }
    } catch (error) {
      logger.error('Failed to create database directory:', error);
      throw error;
    }
  }

  return new Promise<void>((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        logger.error('Failed to open database:', err);
        reject(err);
        return;
      }
      logger.info('Database opened');
      createTables().then(resolve).catch(reject);
    });
  });
}

async function createTables() {
  const run = promisify(db.run.bind(db));

  // Stores table
  await run(`
    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      engine TEXT NOT NULL,
      template TEXT,
      status TEXT NOT NULL,
      url TEXT,
      namespace TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      error_message TEXT
    )
  `);

  // Store events table (audit log)
  await run(`
    CREATE TABLE IF NOT EXISTS store_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id TEXT NOT NULL,
      action TEXT NOT NULL,
      status TEXT NOT NULL,
      message TEXT,
      error TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id)
    )
  `);

  // Store specs table (for reconciliation)
  await run(`
    CREATE TABLE IF NOT EXISTS store_specs (
      store_id TEXT PRIMARY KEY,
      spec TEXT NOT NULL,
      FOREIGN KEY (store_id) REFERENCES stores(id)
    )
  `);

  logger.info('Database tables created');
}

export function getDatabase(): sqlite3.Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export function closeDatabase() {
  return new Promise<void>((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}
