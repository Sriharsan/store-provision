import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { StoreModel, StoreStatus } from '../../models/store';
import { Provisioner } from '../../provisioning/provisioner';
import { logger } from '../../utils/logger';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting: 10 store creations per hour per IP
const createStoreLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many store creation requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Get all stores
router.get('/', async (req: Request, res: Response) => {
  try {
    const storeModel = new StoreModel();
    const stores = await storeModel.findAll();
    res.json(stores);
  } catch (error: any) {
    logger.error('Error fetching stores:', error);
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
});

// Get store by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const storeModel = new StoreModel();
    const store = await storeModel.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    res.json(store);
  } catch (error: any) {
    logger.error('Error fetching store:', error);
    res.status(500).json({ error: 'Failed to fetch store' });
  }
});

// Create new store
router.post('/', createStoreLimiter, async (req: Request, res: Response) => {
  try {
    const { name, engine, template } = req.body;

    if (!name || !engine) {
      return res.status(400).json({ error: 'Name and engine are required' });
    }

    if (engine !== 'medusa' && engine !== 'woocommerce') {
      return res.status(400).json({ error: 'Engine must be medusa or woocommerce' });
    }

    // Generate store ID
    const storeId = uuidv4().substring(0, 8);
    const namespace = `store-${storeId}`;

    const storeModel = new StoreModel();
    const provisioner = new Provisioner();

    // Create store record
    const store = await storeModel.create({
      id: storeId,
      name,
      engine,
      template: template || 'starter',
      status: StoreStatus.REQUESTED,
      namespace
    });

    // Start provisioning asynchronously
    provisioner.provisionStore(storeId).catch(error => {
      logger.error(`Background provisioning failed for ${storeId}:`, error);
    });

    res.status(201).json(store);
  } catch (error: any) {
    logger.error('Error creating store:', error);
    res.status(500).json({ error: 'Failed to create store' });
  }
});

// Delete store
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const storeModel = new StoreModel();
    const provisioner = new Provisioner();
    const store = await storeModel.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Start deletion asynchronously
    provisioner.deleteStore(req.params.id).catch(error => {
      logger.error(`Background deletion failed for ${req.params.id}:`, error);
    });

    res.json({ message: 'Store deletion initiated' });
  } catch (error: any) {
    logger.error('Error deleting store:', error);
    res.status(500).json({ error: 'Failed to delete store' });
  }
});

export { router as storeRouter };
