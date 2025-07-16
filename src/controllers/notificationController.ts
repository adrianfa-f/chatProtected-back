import { Request, Response } from 'express';
import { savePushSubscription } from '../services/notificationService';

export const subscribeUser = async (req: Request, res: Response) => {
    try {
        const { subscription } = req.body;
        const userId = req.body.userId;

        await savePushSubscription(userId, subscription);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error guardando suscripción:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};