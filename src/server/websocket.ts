import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { PrismaClient } from '@prisma/client';
import messageService from 'services/message.service';


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
        } else {
            console.warn('[WS] Conexión sin userId');
        }

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