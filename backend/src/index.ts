import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createStore, getStores, getStoreById, deleteStore } from './controllers/storeController';
import { reconciliationEngine } from './reconciliation/engine';
import prisma from './prisma';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.post('/stores', createStore);
app.get('/stores', getStores);
app.get('/stores/:id', getStoreById);
app.delete('/stores/:id', deleteStore);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Start Reconciliation Loop
  reconciliationEngine.start();
});

// Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});
