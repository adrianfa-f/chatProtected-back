import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const setupWebSocket = (server: HttpServer) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true
        },
        connectionStateRecovery: {
            maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutos
            skipMiddlewares: true,
        }
    });

    io.on('connection', (socket) => {
        console.log(`[WS] Usuario conectado: ${socket.id} - IP: ${socket.handshake.address}`);

        socket.on('authenticate', async (userId: string) => {
            try {
                console.log(`[WS] Autenticando usuario: ${userId}`);
                socket.data.userId = userId;

                // Actualizar estado en DB
                await prisma.user.update({
                    where: { id: userId },
                    data: { online: true }
                });

                // Notificar a contactos
                const userChats = await prisma.chat.findMany({
                    where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
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
            } catch (error) {
                console.error('[WS] Error en autenticación:', error);
            }
        });

        socket.on('join-chat', (chatId: string) => {
            console.log(`[WS] Usuario ${socket.data.userId} solicitó unirse al chat ${chatId}`);
            socket.join(chatId);
            console.log(`[WS] Usuario ${socket.data.userId} unido al chat ${chatId}`);

            // Debug: Listar todas las salas
            const rooms = io.sockets.adapter.rooms;
            console.log(`[WS] Salas activas: ${Array.from(rooms.keys()).join(', ')}`);
        });

        socket.on('leave-chat', (chatId: string) => {
            console.log(`[WS] Usuario ${socket.data.userId} solicitó salir del chat ${chatId}`);
            socket.leave(chatId);
            console.log(`[WS] Usuario ${socket.data.userId} salió del chat ${chatId}`);
        });

        socket.on('send-message', async (messageData: {
            chatId: string;
            senderId: string;
            receiverId: string;
            ciphertext: string;
            nonce?: string;
        }) => {
            try {
                console.log(`[WS] Mensaje recibido de ${messageData.senderId} a ${messageData.receiverId} en chat ${messageData.chatId}`);
                console.log(`[WS] Contenido del mensaje (truncado): ${messageData.ciphertext.substring(0, 20)}...`);

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

                // Verificar si el receptor está en la sala
                const chatRoom = io.sockets.adapter.rooms.get(messageData.chatId);
                const isReceiverInRoom = chatRoom && Array.from(chatRoom).some(socketId => {
                    const socket = io.sockets.sockets.get(socketId);
                    return socket?.data.userId === messageData.receiverId;
                });

                console.log(`[WS] Emitiendo mensaje a sala: ${messageData.chatId}`);
                io.to(messageData.chatId).emit('receive-message', newMessage);

                if (!isReceiverInRoom) {
                    console.log(`[WS] Receptor no está en la sala, enviando notificación a ${messageData.receiverId}`);
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

        // Evento de prueba
        socket.on('test-event', (data) => {
            console.log(`[WS] Evento de prueba recibido de ${socket.data.userId}:`, data);
            socket.emit('test-response', {
                received: data,
                serverTime: new Date().toISOString()
            });
        });

        socket.on('disconnect', async (reason) => {
            console.log(`[WS] Usuario desconectado: ${socket.id} (Razón: ${reason})`);
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
                        where: { OR: [{ user1Id: userId }, { user2Id: userId }] }
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
                    console.error('[WS] Error al actualizar estado de desconexión:', error);
                }
            }
        });
    });

    // Logging adicional para eventos de servidor
    io.engine.on("connection_error", (err) => {
        console.error('[WS] Error de conexión:', err.req);     // la solicitud de solicitud http
        console.error('[WS] Detalles:', err.code, err.message); // el código de error, por ejemplo 1
        console.error('[WS] Contexto:', err.context);           // algún contexto adicional
    });

    return io;
};