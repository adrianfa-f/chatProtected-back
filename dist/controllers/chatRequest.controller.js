"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChatRequest = exports.acceptChatRequest = exports.getChatRequests = void 0;
const client_1 = require("@prisma/client");
const chat_request_service_1 = require("../services/chat-request.service");
const prisma = new client_1.PrismaClient();
const getChatRequests = async (req, res) => {
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error al obtener solicitudes de chat"
        });
    }
};
exports.getChatRequests = getChatRequests;
const acceptChatRequest = async (req, res) => {
    const { chatRequestId } = req.params;
    console.log("chatRequestId: ", chatRequestId);
    try {
        const chatRequest = await prisma.chatRequest.findUnique({ where: { id: chatRequestId } });
        console.log("chatRequest: ", chatRequest);
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error al aceptar la solicitud." });
    }
};
exports.acceptChatRequest = acceptChatRequest;
const createChatRequest = async (req, res) => {
    const fromUserId = req.body.userId;
    const { toUserId } = req.body;
    try {
        const chatRequest = await chat_request_service_1.ChatRequestService.createRequest(fromUserId, toUserId);
        res.status(200).json({ success: true, chatRequest });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error al crear la solicitud de Chat" });
    }
};
exports.createChatRequest = createChatRequest;
