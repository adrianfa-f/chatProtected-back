"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWebSocket = void 0;
const socket_io_1 = require("socket.io");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const setupWebSocket = (server) => {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });
    io.on('connection', (socket) => {
        console.log(`Usuario conectado: ${socket.id}`);
        // Autenticar al usuario con su ID
        socket.on('authenticate', async (userId) => {
            try {
                // Guardar el ID de usuario asociado a este socket
                socket.data.userId = userId;
                console.log(`Usuario autenticado: ${userId}`);
                // Actualizar estado del usuario en la base de datos
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        online: true
                    } // Solución temporal
                });
                // Notificar a los contactos del usuario
                const userChats = await prisma.chat.findMany({
                    where: {
                        OR: [{ user1Id: userId }, { user2Id: userId }]
                    },
                    select: {
                        id: true,
                        user1Id: true,
                        user2Id: true
                    }
                });
                userChats.forEach(chat => {
                    const otherUserId = chat.user1Id === userId ? chat.user2Id : chat.user1Id;
                    io.to(otherUserId).emit('user-status', {
                        userId,
                        online: true
                    });
                });
            }
            catch (error) {
                console.error('Error en autenticación WebSocket:', error);
            }
        });
        // Unirse a un chat específico
        socket.on('join-chat', (chatId) => {
            socket.join(chatId);
            console.log(`Usuario ${socket.data.userId} se unió al chat ${chatId}`);
        });
        // Salir de un chat
        socket.on('leave-chat', (chatId) => {
            socket.leave(chatId);
            console.log(`Usuario ${socket.data.userId} salió del chat ${chatId}`);
        });
        // Manejar envío de mensajes
        socket.on('send-message', async (messageData) => {
            try {
                // Guardar mensaje en la base de datos
                const newMessage = await prisma.message.create({
                    data: {
                        chatId: messageData.chatId,
                        senderId: messageData.senderId,
                        receiverId: messageData.receiverId,
                        ciphertext: messageData.ciphertext,
                        nonce: messageData.nonce
                    }
                });
                // Actualizar última actividad del chat
                await prisma.chat.update({
                    where: { id: messageData.chatId },
                    data: { updatedAt: new Date() }
                });
                // Enviar mensaje a todos en el chat
                io.to(messageData.chatId).emit('receive-message', newMessage);
                // Notificar al receptor si no está en el chat
                io.to(messageData.receiverId).emit('new-message-notification', {
                    chatId: messageData.chatId,
                    senderId: messageData.senderId
                });
            }
            catch (error) {
                console.error('Error al enviar mensaje:', error);
            }
        });
        // Manejar desconexión
        socket.on('disconnect', async () => {
            console.log(`Usuario desconectado: ${socket.id}`);
            const userId = socket.data.userId;
            if (userId) {
                try {
                    // Actualizar estado del usuario
                    await prisma.user.update({
                        where: { id: userId },
                        data: {
                            online: false,
                            lastSeen: new Date()
                        } // Solución temporal
                    });
                    // Notificar a los contactos
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
                }
                catch (error) {
                    console.error('Error al actualizar estado de desconexión:', error);
                }
            }
        });
    });
    return io;
};
exports.setupWebSocket = setupWebSocket;
