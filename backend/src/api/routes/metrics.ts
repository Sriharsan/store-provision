import express, { Request, Response } from 'express';
import { metrics } from '../../utils/metrics';
import { logger } from '../../utils/logger';

const router = express.Router();

// Prometheus metrics endpoint
router.get('/', (req: Request, res: Response) => {
  try {
    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.send(metrics.getPrometheusFormat());
  } catch (error: any) {
    logger.error('Error getting metrics:', error);
    res.status(500).send('# Error generating metrics\n');
  }
});

// JSON summary endpoint (for dashboard)
router.get('/summary', (req: Request, res: Response) => {
  try {
    res.json(metrics.getSummary());
  } catch (error: any) {
    logger.error('Error getting metrics summary:', error);
    res.status(500).json({ error: 'Failed to get metrics summary' });
  }
});

export { router as metricsRouter };
