import { Request, Response } from 'express';
import prisma from '../prisma';
import { v4 as uuidv4 } from 'uuid';

export const createStore = async (req: Request, res: Response) => {
    try {
        const { engine = 'medusa', template = 'starter', cpu, memory, storage } = req.body;

        const store = await prisma.store.create({
            data: {
                id: uuidv4(), // Explicitly generating for clarity, though default exists
                engine,
                template,
                status: 'REQUESTED',
                cpu: cpu || '500m',
                memory: memory || '512Mi',
                storage: storage || '5Gi',
            },
        });

        // Log event
        await prisma.storeEvent.create({
            data: {
                storeId: store.id,
                action: 'created',
                status: 'REQUESTED',
                message: 'Store creation requested via API',
            },
        });

        res.status(201).json(store);
    } catch (error) {
        console.error('Error creating store:', error);
        res.status(500).json({ error: 'Failed to create store' });
    }
};

export const getStores = async (req: Request, res: Response) => {
    try {
        const stores = await prisma.store.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(stores);
    } catch (error) {
        console.error('Error listing stores:', error);
        res.status(500).json({ error: 'Failed to list stores' });
    }
};

export const getStoreById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const store = await prisma.store.findUnique({
            where: { id },
            include: {
                events: {
                    orderBy: { timestamp: 'desc' },
                },
            },
        });

        if (!store) {
            return res.status(404).json({ error: 'Store not found' });
        }

        res.json(store);
    } catch (error) {
        console.error('Error getting store:', error);
        res.status(500).json({ error: 'Failed to get store' });
    }
};

export const deleteStore = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const existing = await prisma.store.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: 'Store not found' });
        }

        // Mark for deletion
        const updated = await prisma.store.update({
            where: { id },
            data: { status: 'DELETING' },
        });

        await prisma.storeEvent.create({
            data: {
                storeId: id,
                action: 'deleting',
                status: 'DELETING',
                message: 'Store marked for deletion by user',
            },
        });

        res.json(updated);
    } catch (error) {
        console.error('Error deleting store:', error);
        res.status(500).json({ error: 'Failed to delete store' });
    }
};
