import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const setupWebSocket = (server: HttpServer) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true
        },
        connectionStateRecovery: {
            maxDisconnectionDuration: 2 * 60 * 1000,
            skipMiddlewares: true,
        }
    });

    io.on('connection', (socket) => {
        console.log(`[WS][${new Date().toISOString()}] Conexión: ${socket.id} | IP: ${socket.handshake.address}`);

        socket.on('authenticate', async (accessToken: string) => {
            try {
                // Verificar token JWT
                const decoded = jwt.verify(accessToken, process.env.JWT_SECRET!);
                const userId = (decoded as any).sub;

                if (!userId) throw new Error('Token inválido: sin userId');

                console.log(`[WS] Autenticando usuario: ${userId}`);
                socket.data.userId = userId;

                // Actualizar estado en DB
                await prisma.user.update({
                    where: { id: userId },
                    data: { online: true }
                });

                // Notificar a contactos
                const userChats = await prisma.chat.findMany({
                    where: {
                        OR: [{ user1Id: userId }, { user2Id: userId }]
                    },
                    select: { id: true, user1Id: true, user2Id: true }
                });

                userChats.forEach(chat => {
                    const otherUserId = chat.user1Id === userId ? chat.user2Id : chat.user1Id;
                    io.to(otherUserId).emit('user-status', {
                        userId,
                        online: true
                    });
                });

                console.log(`[WS] Usuario autenticado: ${userId}`);
                socket.emit('authenticated');

            } catch (error) {
                console.error('[WS] Error en autenticación:', error);
                socket.emit('invalid-token');
                socket.disconnect();
            }
        });

        socket.on('join-chat', (chatId: string) => {
            if (!socket.data.userId) {
                console.error('[WS] Intento de unirse sin autenticar');
                return;
            }

            console.log(`[WS] Usuario ${socket.data.userId} uniendo a chat: ${chatId}`);
            socket.join(chatId);
            console.log(`[WS] Usuario unido al chat: ${chatId}`);

            // Debug: Listar salas
            const rooms = Array.from(io.sockets.adapter.rooms.keys());
            console.log(`[WS] Salas activas: ${rooms.join(', ')}`);
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
            nonce?: string;
        }) => {
            try {
                if (!socket.data.userId) {
                    throw new Error('Usuario no autenticado');
                }

                console.log(`[WS] Mensaje recibido de ${messageData.senderId} para ${messageData.receiverId}`);

                // Crear mensaje en DB
                const newMessage = await prisma.message.create({
                    data: {
                        chatId: messageData.chatId,
                        senderId: messageData.senderId,
                        receiverId: messageData.receiverId,
                        ciphertext: messageData.ciphertext,
                        nonce: messageData.nonce
                    }
                });

                // Actualizar chat
                await prisma.chat.update({
                    where: { id: messageData.chatId },
                    data: { updatedAt: new Date() }
                });

                // Emitir a todos en el chat
                io.to(messageData.chatId).emit('receive-message', newMessage);

                // Verificar si receptor necesita notificación
                const receivers = Array.from(io.sockets.adapter.rooms.get(messageData.chatId) || []);
                const isReceiverPresent = receivers.some(sid => {
                    const sock = io.sockets.sockets.get(sid);
                    return sock?.data.userId === messageData.receiverId;
                });

                if (!isReceiverPresent) {
                    io.to(messageData.receiverId).emit('new-message-notification', {
                        chatId: messageData.chatId,
                        senderId: messageData.senderId
                    });
                }

            } catch (error) {
                console.error('[WS] Error al enviar mensaje:', error);
                socket.emit('message-error', {
                    error: 'Failed to send message',
                    details: error
                });
            }
        });

        socket.on('test-event', (data) => {
            console.log(`[WS] Test recibido de ${socket.data.userId || 'anon'}:`, data);
            socket.emit('test-response', {
                received: data,
                serverTime: new Date().toISOString()
            });
        });

        socket.on('disconnect', async (reason) => {
            console.log(`[WS] Desconexión: ${socket.id} | Razón: ${reason}`);
            const userId = socket.data.userId;

            if (userId) {
                try {
                    // Actualizar estado en DB
                    await prisma.user.update({
                        where: { id: userId },
                        data: {
                            online: false,
                            lastSeen: new Date()
                        }
                    });

                    // Notificar a contactos
                    const userChats = await prisma.chat.findMany({
                        where: {
                            OR: [{ user1Id: userId }, { user2Id: userId }]
                        }
                    });

                    userChats.forEach(chat => {
                        const otherUserId = chat.user1Id === userId ? chat.user2Id : chat.user1Id;
                        io.to(otherUserId).emit('user-status', {
                            userId,
                            online: false,
                            lastSeen: new Date()
                        });
                    });
                } catch (error) {
                    console.error('[WS] Error al actualizar estado:', error);
                }
            }
        });
    });

    // Manejar errores de conexión
    io.engine.on("connection_error", (err) => {
        console.error('[WS] Connection error:', err.req);
        console.error('[WS] Code:', err.code, '| Message:', err.message);
        console.error('[WS] Context:', err.context);
    });

    return io;
};