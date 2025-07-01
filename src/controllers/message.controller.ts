import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import MessageService from '../services/message.service';

export const sendMessage = async (req: Request, res: Response) => {
    try {
        const userId = req.body.userId;

        const { chatId, receiverId, ciphertext, nonce } = req.body;
        const message = await MessageService.createMessage(
            chatId,
            userId,
            receiverId,
            ciphertext,
            nonce
        );

        res.status(StatusCodes.CREATED).json({
            success: true,
            data: message
        });
    } catch (error: any) {
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            error: error.message
        });
    }
};

export const getChatMessages = async (req: Request, res: Response) => {
    try {
        const { chatId } = req.params;
        const messages = await MessageService.getMessagesByChat(chatId);

        res.status(StatusCodes.OK).json({
            success: true,
            data: messages
        });
    } catch (error: any) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: error.message
        });
    }
};