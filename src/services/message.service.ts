import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default {
    async createMessage(
        chatId: string,
        senderId: string,
        receiverId: string,
        ciphertext: string,
        nonce?: string
    ) {
        // 🧾 Crear mensaje en base de datos
        const message = await prisma.message.create({
            data: {
                chatId,
                senderId,
                receiverId,
                ciphertext,
                nonce
            }
        });

        // 📅 Actualizar chat (última actividad)
        await prisma.chat.update({
            where: { id: chatId },
            data: { updatedAt: new Date() }
        });

        return {
            id: message.id,
            chatId: message.chatId,
            senderId: message.senderId,
            receiverId: message.receiverId,
            ciphertext: message.ciphertext,
            nonce: message.nonce,
            createdAt: message.createdAt
        };
    },

    async getMessagesByChat(chatId: string, receiverId: string) {
        // Obtener el timestamp del último visto del receptor
        const receiver = await prisma.user.findUnique({
            where: { id: receiverId },
            select: { lastSeen: true }
        });

        // 🟣 Actualizar solo mensajes entregados DESPUÉS del último seen
        await prisma.message.updateMany({
            where: {
                chatId,
                receiverId,
                status: 'delivered',
                createdAt: { gt: receiver?.lastSeen || new Date(0) }
            },
            data: { status: 'seen' }
        });

        // 📥 Devolver solo mensajes nuevos (posteriores al lastSeen)
        return prisma.message.findMany({
            where: {
                chatId,
                /*                 receiverId,
                                createdAt: { gt: receiver?.lastSeen || new Date(0) } */
            },
            orderBy: { createdAt: 'asc' }
        });
    }

};