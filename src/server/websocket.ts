import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { PrismaClient } from '@prisma/client';
import messageService from '../services/message.service';
import callService from '../services/call.service';
import { sendCallNotification, sendPushNotification } from '../services/notificationService';


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

    const userSocketMap = new Map<string, string>();

    io.on('connection', async (socket) => {
        console.log(`[WS][${new Date().toISOString()}] Conexión: ${socket.id} | IP: ${socket.handshake.address}`);

        // Obtener userId de la query
        const userId = socket.handshake.query.userId;


        if (userId && typeof userId === 'string') {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    online: false
                }
            });

            userSocketMap.set(userId, socket.id);
            socket.data.userId = userId;

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

        socket.on('call-request', async ({ from, to, userName, chatId }) => {
            /* const isRecipientOnline = userSocketMap.has(to);
            if (isRecipientOnline) {
                io.to(to).emit('call-request', { from, userName })
            } else {
                try {
                    const receiverUser = await prisma.user.findUnique({
                        where: { id: to },
                        select: { pushSubscription: true }
                    });

                    if (receiverUser && receiverUser.pushSubscription) {
                        await sendCallNotification(to, from, userName, chatId, 'incoming-call');
                    }

                } catch (error) {
                    console.error('Error enviando notificación de llamada:', error);
                }
            } */
            io.to(to).emit('call-request', { from, userName })
            await sendCallNotification(to, from, userName, chatId, 'incoming-call');

        })

        // Cuando A llama a B
        socket.on('call-user', ({ from, to, sdp }) => {
            io.to(to).emit('incoming-call', { from, sdp });
        });

        // Cuando B responde a A
        socket.on('answer-call', async ({ from, to, sdp }) => {
            io.to(to).emit('call-answered', { from, sdp });
            const startedAt = new Date().toISOString();
            try {
                await callService.createCall(from, to, 'answered', new Date(startedAt));
            } catch (err) {
                console.log("Error al registrar la llamada iniciada: ", err)
            }
        });

        // Intercambio de candidatos ICE
        socket.on('ice-candidate', ({ from, to, candidate }) => {
            io.to(to).emit('ice-candidate', { from, candidate });
        });

        // Finalizar llamada
        socket.on('end-call', async ({ from, to }) => {
            io.to(to).emit('call-ended', { from });
            const endedAt = new Date().toISOString();
            try {
                await prisma.call.updateMany({
                    where: {
                        status: 'answered',
                        endedAt: null
                    },
                    data: {
                        endedAt: new Date(endedAt)
                    }
                });
            } catch (err) {
                console.log("Error al actualizar la llamada finalizada: ", err)
            }
        });

        socket.on('decline-call', async ({ to, from }) => {
            io.to(to).emit('declined-call')
            try {
                await callService.createCall(to, from, 'rejected')
            } catch (err) {
                console.log("Error al registrar la llamda rechazada: ", err)
            }

        })

        socket.on('cancel-call', async ({ from, to, userName, chatId }) => {
            /* const isRecipientOnline = userSocketMap.has(to);
            if (isRecipientOnline) {
                io.to(to).emit('canceled-call');
            } else {
                try {
                    const receiverUser = await prisma.user.findUnique({
                        where: { id: to },
                        select: { pushSubscription: true }
                    });

                    if (receiverUser && receiverUser.pushSubscription) {
                        await sendCallNotification(to, from, userName, chatId, 'cancel-call');
                    }

                } catch (error) {
                    console.error('Error enviando notificación de llamada:', error);
                }
            } */
            io.to(to).emit('canceled-call');
            await sendCallNotification(to, from, userName, chatId, 'cancel-call');
            await callService.createCall(from, to, 'missed')
        })

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

                io.to(savedMessage.receiverId).emit('chat-message-summary', {
                    chatId: savedMessage.chatId,
                    senderId: savedMessage.senderId,
                    ciphertext: savedMessage.ciphertext
                });

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

                // 📢 Construir mensaje completo para enviar
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
                    // Emitir evento de notificación solo al receptor
                    io.to(messageData.receiverId).emit('new-message-notification', {
                        chatId: messageData.chatId,
                        senderId: messageData.senderId,
                        messageId: savedMessage.id
                    });

                    // 💌 Enviar notificación PUSH solo si hay suscripción
                    const receiverUser = await prisma.user.findUnique({
                        where: { id: messageData.receiverId },
                        select: { pushSubscription: true }
                    });

                    if (receiverUser && receiverUser.pushSubscription) {
                        await sendPushNotification(
                            messageData.receiverId,
                            messageData.ciphertext,
                            messageData.chatId,
                            senderName
                        );
                    }
                }

            } catch (error) {
                console.error('[WS] Error al procesar mensaje:', error);
                socket.emit('message-error', {
                    error: 'Failed to process message',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });

        socket.on('manual-disconnect', ({ userId }) => {
            userSocketMap.delete(userId);
            console.log(`Usuario ${userId} marcado como desconectado`);
        });

        socket.on('manual-reconnect', ({ userId }) => {
            userSocketMap.set(userId, socket.id);
            console.log(`Usuario ${userId} marcado como reconectado`);
        });

        // Manejar desconexión de usuario
        socket.on('disconnect', async () => {
            const userId = socket.data.userId;
            if (userId) {
                console.log(`[WS] Usuario desconectado: ${userId}`);

                // 3. Actualizar estado en base de datos
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        lastSeen: new Date(),
                        online: false
                    }
                });

                userSocketMap.delete(userId);
                socket.leave(userId)
                console.log(`[WS] Estado actualizado para usuario desconectado: ${userId}`);
            }
        });

        // Manejar evento de peer desconectado
        socket.on('peer-disconnected', ({ userId }) => {
            console.log(`[WS] Peer desconectado recibido: ${userId}`);
            // Este evento se recibe cuando un peer se desconecta
            // El frontend manejará la terminación de la llamada
        });
    });

    io.engine.on("connection_error", (err) => {
        console.error('[WS] Error de conexión:', err.req);
        console.error('[WS] Código:', err.code, '| Mensaje:', err.message);
    });

    return io;
};