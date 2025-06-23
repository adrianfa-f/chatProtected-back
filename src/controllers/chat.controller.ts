import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ChatService } from '../services/chat.service';

export const createChat = async (req: Request, res: Response) => {
    try {
        const userId = req.body.userId;

        const { otherUserId } = req.body;
        const chat = await ChatService.createChat(userId, otherUserId);

        res.status(StatusCodes.CREATED).json({
            success: true,
            data: chat
        });
    } catch (error: any) {
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            error: error.message
        });
    }
};

export const getUserChats = async (req: Request, res: Response) => {
    try {
        const userId = req.body.userId;
        const chats = await ChatService.getUserChats(userId);

        res.status(StatusCodes.OK).json({
            success: true,
            data: chats
        });
    } catch (error: any) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: error.message
        });
    }
};
