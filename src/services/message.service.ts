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

    async getMessagesByChat(chatId: string) {
        return prisma.message.findMany({
            where: { chatId },
            orderBy: { createdAt: 'asc' }
        });
    }
};