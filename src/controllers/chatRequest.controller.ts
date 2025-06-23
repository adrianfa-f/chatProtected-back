import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ChatRequestService } from '../services/chat-request.service'

const prisma = new PrismaClient()

export const getChatRequests = async (req: Request, res: Response): Promise<void> => {
    const userId = req.body.userId;

    try {
        // Obtener todas las solicitudes relacionadas con el usuario
        const requests = await prisma.chatRequest.findMany({
            where: {
                OR: [
                    { toUserId: userId, status: 'pending' },
                    { fromUserId: userId, status: 'pending' }
                ]
            },
            include: {
                fromUser: {
                    select: {
                        id: true,
                        username: true,
                        publicKey: true
                    }
                },
                toUser: {
                    select: {
                        id: true,
                        username: true,
                        publicKey: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Transformar a la estructura esperada por el frontend
        const formattedRequests = requests.map(request => ({
            id: request.id,
            fromUser: request.fromUser,
            toUser: request.toUser,
            status: request.status,
            timestamp: request.createdAt
        }));

        res.status(200).json(formattedRequests);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error al obtener solicitudes de chat"
        });
    }
};

export const acceptChatRequest = async (req: Request, res: Response): Promise<void> => {
    const { chatRequestId } = req.params;
    console.log("chatRequestId: ", chatRequestId)

    try {
        const chatRequest = await prisma.chatRequest.findUnique({ where: { id: chatRequestId } });
        console.log("chatRequest: ", chatRequest)
        if (!chatRequest || chatRequest.status !== 'pending') {
            res.status(400).json({ success: false, message: "Solicitud de chat inválida o ya aceptada." });
            return;
        }

        // ✅ Aquí estamos seguros de que `chatRequest` tiene datos
        const chat = await prisma.chat.create({
            data: {
                user1Id: chatRequest.fromUserId,
                user2Id: chatRequest.toUserId,
            },
        });

        await prisma.chatRequest.update({ where: { id: chatRequestId }, data: { status: 'accepted' } });

        res.status(200).json({ success: true, chat });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error al aceptar la solicitud." });
    }
};

export const createChatRequest = async (req: Request, res: Response) => {
    const fromUserId = req.body.userId
    const { toUserId } = req.body
    try {
        const chatRequest = await ChatRequestService.createRequest(fromUserId, toUserId)
        res.status(200).json({ success: true, chatRequest });
    } catch (error) {
        console.error(error)
        res.status(500).json({ success: false, message: "Error al crear la solicitud de Chat" })
    }

}
