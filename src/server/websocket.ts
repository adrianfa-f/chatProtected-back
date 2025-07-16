import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { PrismaClient } from '@prisma/client';
import messageService from '../services/message.service';
import { sendPushNotification } from '../services/notificationService';


const prisma = new PrismaClient();

export const setupWebSocket = (server: HttpServer) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL,
            methods: ['GET', 'POST'],
            credentials: true,
            allowedHeaders: ['Authorization']
        },
        connectionStateRecovery: {
            maxDisconnectionDuration: 2 * 60 * 1000,
            skipMiddlewares: true,
        },
        transports: ['websocket'],
        perMessageDeflate: false,
        cookie: false
    });

    io.on('connection', (socket) => {
        console.log(`[WS][${new Date().toISOString()}] Conexión: ${socket.id} | IP: ${socket.handshake.address}`);

        // Obtener userId de la query
        const userId = socket.handshake.query.userId;
        if (userId && typeof userId === 'string') {
            console.log(`[WS] Usuario conectado: ${userId}`);
            socket.data.userId = userId;
            if (userId) socket.join(userId);
        } else {
            console.warn('[WS] Conexión sin userId');
        }

        socket.on('send-chat-request', async (toUserId: string) => {
            const fromUserId = socket.data.userId;
            if (!fromUserId) {
                console.warn('[WS] Usuario no autenticado para enviar solicitud de chat');
                return;
            }

            try {
                // Crear la solicitud básica (solo IDs)
                const created = await prisma.chatRequest.create({
                    data: {
                        fromUserId,
                        toUserId,
                        status: 'pending',
                    }
                });

                // Buscar la solicitud con datos completos
                const fullRequest = await prisma.chatRequest.findUnique({
                    where: { id: created.id },
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
                    }
                });

                // Formatear como espera el frontend
                const formattedRequest = {
                    id: fullRequest!.id,
                    fromUser: fullRequest!.fromUser,
                    toUser: fullRequest!.toUser,
                    status: fullRequest!.status,
                    timestamp: fullRequest!.createdAt
                };

                // Emitir al destinatario
                io.to(toUserId).emit('receive-chat-request', formattedRequest);

                console.log(`[WS] Solicitud de chat emitida a ${toUserId}`);
            } catch (error) {
                console.error('[WS] Error al procesar solicitud de chat:', error);
                socket.emit('chat-request-error', {
                    error: 'No se pudo enviar la solicitud de chat',
                    details: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        });

        socket.on('accept-chat-request', async (chatRequestId: string) => {
            const userId = socket.data.userId;
            if (!userId) return;

            try {
                const chatRequest = await prisma.chatRequest.findUnique({
                    where: { id: chatRequestId }
                });

                if (!chatRequest || chatRequest.status !== 'pending') {
                    socket.emit('chat-accept-error', { message: 'Solicitud inválida o ya aceptada.' });
                    return;
                }

                // Crear el chat
                const newChat = await prisma.chat.create({
                    data: {
                        user1Id: chatRequest.fromUserId,
                        user2Id: chatRequest.toUserId
                    }
                });

                // Actualizar estado del request
                await prisma.chatRequest.update({
                    where: { id: chatRequestId },
                    data: { status: 'accepted' }
                });

                // Emitir evento al otro usuario para que actualice su chat list
                const otherUserId = userId === chatRequest.fromUserId
                    ? chatRequest.toUserId
                    : chatRequest.fromUserId;

                io.to(otherUserId).emit('new-chat-created', {
                    chatId: newChat.id
                });

                // Confirmar al usuario que realizó la aceptación
                socket.emit('chat-accepted', { success: true });

                console.log(`[WS] Chat creado entre ${chatRequest.fromUserId} y ${chatRequest.toUserId}`);
            } catch (error) {
                console.error('[WS] Error al aceptar solicitud de chat:', error);
                socket.emit('chat-accept-error', { message: 'Ocurrió un error al aceptar la solicitud.' });
            }
        });

        socket.on('join-chat', (chatId: string) => {
            if (!socket.data.userId) {
                console.warn('[WS] Intento de unirse sin userId');
                return;
            }
            console.log(`[WS] Usuario ${socket.data.userId} uniendo a chat: ${chatId}`);
            socket.join(chatId);
        });

        socket.on('leave-chat', (chatId: string) => {
            if (!socket.data.userId) return;
            console.log(`[WS] Usuario ${socket.data.userId} saliendo de chat: ${chatId}`);
            socket.leave(chatId);
        });

        socket.on('send-message', async (messageData: {
            chatId: string;
            senderId: string;
            receiverId: string;
            ciphertext: string;
            createdAt: string;
        }) => {
            try {
                if (!socket.data.userId) {
                    throw new Error('Usuario no autenticado');
                }

                console.log(`[WS] Mensaje recibido de ${messageData.senderId} para ${messageData.receiverId}`);

                // 🔒 Persistir mensaje en base de datos
                const savedMessage = await messageService.createMessage(
                    messageData.chatId,
                    messageData.senderId,
                    messageData.receiverId,
                    messageData.ciphertext
                );

                // Obtener nombre del remitente para la notificación
                const sender = await prisma.user.findUnique({
                    where: { id: messageData.senderId },
                    select: { username: true }
                });
                const senderName = sender?.username || 'Usuario';

                // 📅 Actualizar última actividad del chat
                await prisma.chat.update({
                    where: { id: messageData.chatId },
                    data: { updatedAt: new Date() }
                });

                // 📨 Construir mensaje completo para enviar
                const fullMessage = {
                    ...savedMessage,
                    createdAt: savedMessage.createdAt.toISOString()
                };

                // 📢 Emitir a todos en el chat
                io.to(messageData.chatId).emit('receive-message', fullMessage);

                // 🔔 Notificar a receptor si no está en el chat
                const chatRoom = io.sockets.adapter.rooms.get(messageData.chatId);
                const isReceiverInRoom = chatRoom && Array.from(chatRoom).some(socketId => {
                    const socket = io.sockets.sockets.get(socketId);
                    return socket?.data.userId === messageData.receiverId;
                });

                if (!isReceiverInRoom) {
                    io.to(messageData.receiverId).emit('new-message-notification', {
                        chatId: messageData.chatId,
                        senderId: messageData.senderId,
                        messageId: savedMessage.id
                    });
                }

                // 💌 Enviar notificación PUSH al receptor
                await sendPushNotification(
                    messageData.receiverId,
                    `Nuevo mensaje de ${senderName}`,
                    messageData.chatId
                );

            } catch (error) {
                console.error('[WS] Error al procesar mensaje:', error);
                socket.emit('message-error', {
                    error: 'Failed to process message',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });

        socket.on('disconnect', (reason) => {
            console.log(`[WS] Desconexión: ${socket.id} | Razón: ${reason}`);
        });
    });

    io.engine.on("connection_error", (err) => {
        console.error('[WS] Error de conexión:', err.req);
        console.error('[WS] Código:', err.code, '| Mensaje:', err.message);
    });

    return io;
};