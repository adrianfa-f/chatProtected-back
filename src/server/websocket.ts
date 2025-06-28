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
        }
    });

    io.on('connection', (socket) => {
        console.log(`Usuario conectado: ${socket.id}`);

        socket.on('authenticate', async (userId: string) => {
            try {
                socket.data.userId = userId;
                console.log(`Usuario autenticado: ${userId}`);

                // Unir al usuario a su sala personal
                socket.join(userId); // AÑADIDO: Unión a sala personal
                console.log(`Usuario ${userId} unido a su sala personal`);

                await prisma.user.update({
                    where: { id: userId },
                    data: { online: true }
                });

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

            } catch (error) {
                console.error('Error en autenticación WebSocket:', error);
            }
        });

        socket.on('join-chat', (chatId: string) => {
            socket.join(chatId);
            console.log(`Usuario ${socket.data.userId} se unió al chat ${chatId}`);
        });

        socket.on('leave-chat', (chatId: string) => {
            socket.leave(chatId);
            console.log(`Usuario ${socket.data.userId} salió del chat ${chatId}`);
        });

        socket.on('send-message', async (messageData: {
            chatId: string;
            senderId: string;
            receiverId: string;
            ciphertext: string;
            nonce?: string;
        }) => {
            try {
                const newMessage = await prisma.message.create({
                    data: {
                        chatId: messageData.chatId,
                        senderId: messageData.senderId,
                        receiverId: messageData.receiverId,
                        ciphertext: messageData.ciphertext,
                        nonce: messageData.nonce
                    }
                });

                await prisma.chat.update({
                    where: { id: messageData.chatId },
                    data: { updatedAt: new Date() }
                });

                // Verificar si el receptor está en la sala del chat (CORRECCIÓN CLAVE)
                const chatRoom = io.sockets.adapter.rooms.get(messageData.chatId);
                const isReceiverInRoom = chatRoom && Array.from(chatRoom).some(socketId => {
                    const socket = io.sockets.sockets.get(socketId);
                    return socket && socket.data.userId === messageData.receiverId;
                });

                // Enviar siempre al chat
                io.to(messageData.chatId).emit('receive-message', newMessage);

                // Notificar solo si el receptor no está en el chat
                if (!isReceiverInRoom) {
                    io.to(messageData.receiverId).emit('new-message-notification', {
                        chatId: messageData.chatId,
                        senderId: messageData.senderId,
                        messageId: newMessage.id // AÑADIDO: ID del mensaje
                    });
                }

            } catch (error) {
                console.error('Error al enviar mensaje:', error);
            }
        });

        socket.on('disconnect', async () => {
            console.log(`Usuario desconectado: ${socket.id}`);
            const userId = socket.data.userId;

            if (userId) {
                try {
                    await prisma.user.update({
                        where: { id: userId },
                        data: {
                            online: false,
                            lastSeen: new Date()
                        }
                    });

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
                    console.error('Error al actualizar estado de desconexión:', error);
                }
            }
        });
    });

    return io;
};