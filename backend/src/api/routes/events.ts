import express, { Request, Response } from 'express';
import { StoreEventModel } from '../../models/store-event';
import { logger } from '../../utils/logger';

const router = express.Router();

// Get events for a specific store
router.get('/store/:storeId', async (req: Request, res: Response) => {
  try {
    const eventModel = new StoreEventModel();
    const events = await eventModel.findByStoreId(req.params.storeId);
    res.json(events);
  } catch (error: any) {
    logger.error('Error fetching store events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get all events
router.get('/', async (req: Request, res: Response) => {
  try {
    const eventModel = new StoreEventModel();
    const limit = parseInt(req.query.limit as string) || 100;
    const events = await eventModel.findAll(limit);
    res.json(events);
  } catch (error: any) {
    logger.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

export { router as eventRouter };
