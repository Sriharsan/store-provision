import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import {
  createStore,
  getStores,
  getStoreById,
  deleteStore
} from './controllers/storeController';

import { reconciliationEngine } from './reconciliation/engine';
import prisma from './prisma';

dotenv.config();

const app = express();

// 🚨 Avoid Windows reserved ports
const PORT = Number(process.env.PORT) || 12000;

// =========================
// Middleware
// =========================

app.use(helmet());
app.use(cors());
app.use(express.json());

// =========================
// Routes
// =========================

app.post('/stores', createStore);
app.get('/stores', getStores);
app.get('/stores/:id', getStoreById);
app.delete('/stores/:id', deleteStore);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// =========================
// Server Startup
// =========================

const server = app.listen(PORT, () => {
  console.log('====================================');
  console.log(`🚀 API Server running on port ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log('====================================');

  reconciliationEngine.start();
});

// =========================
// Graceful Shutdown
// =========================

const shutdown = async () => {
  console.log('🛑 Graceful shutdown initiated...');

  await prisma.$disconnect();

  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
