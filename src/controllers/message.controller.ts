import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import MessageService from '../services/message.service';
import { PrismaClient } from '@prisma/client'; // Asegúrate de importar prisma

export const sendMessage = async (req: Request, res: Response) => {
    try {
        const prisma = new PrismaClient();
        const userId = req.body.userId;
        const { chatId, receiverId, ciphertext, nonce } = req.body;

        // Crear el mensaje
        const message = await MessageService.createMessage(
            chatId,
            userId,
            receiverId,
            ciphertext,
            nonce
        );

        // Actualizar la fecha de actualización del chat
        await prisma.chat.update({
            where: { id: chatId },
            data: { updatedAt: new Date() }
        });

        // Obtener la instancia de io para emitir por WebSocket
        const io = req.app.get('io');

        // Construir objeto de mensaje para WebSocket
        const socketMessage = {
            ...message,
            createdAt: message.createdAt.toISOString(),
            plaintext: null // Por seguridad no enviamos texto plano
        };

        // Emitir a todos en el chat
        io.to(chatId).emit('receive-message', socketMessage);

        // Verificar si receptor necesita notificación
        const chatRoom = io.sockets.adapter.rooms.get(chatId);
        const isReceiverInRoom = chatRoom && Array.from(chatRoom).some(socketId => {
            const socket = io.sockets.sockets.get(socketId);
            return socket?.data.userId === receiverId;
        });

        if (!isReceiverInRoom) {
            io.to(receiverId).emit('new-message-notification', {
                chatId: chatId,
                senderId: userId
            });
        }

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