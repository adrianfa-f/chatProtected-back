import { Request, Response } from 'express';
import callService from '../services/call.service';

export const getCalls = async (req: Request, res: Response) => {
    try {
        const userId = req.body.userId;
        const calls = await callService.getCallsForUser(userId);
        res.json(calls);
    } catch (error) {
        console.error('Error fetching calls:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getMissedCount = async (req: Request, res: Response) => {
    try {
        const userId = req.body.userId;

        const count = await callService.getMissedCountForUser(userId)

        res.json({ count });
    } catch (err) {
        console.log("Error al obtener las llamdas perdids: ", err)
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const markAsSeen = async (req: Request, res: Response) => {
    try {
        const userId = req.body.userId;

        callService.markAsSeenForUser(userId)

        res.json({ success: true });
    } catch (err) {
        console.log("Error al marcar como visto los calls: ", err)
    }
}
