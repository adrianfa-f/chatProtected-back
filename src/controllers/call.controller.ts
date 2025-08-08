import { Request, Response } from 'express';
import callService from '../services/call.service';

export const createCalls = async (req: Request, res: Response) => {
    try {
        const { fromId, toId, status, startedAt, endedAt } = req.body
        const call = await callService.createCall(fromId, toId, status, startedAt, endedAt)
        res.json(call)
    } catch (err) {
        console.log("No se creo correctamente el registro de la llamada:", err)
        res.status(500).json({ error: 'Internal server error' });
    }
}

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
