import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient()

export default {
    async createMessage(chatId: string, senderId: string, receiverId: string, ciphertext: string, nonce?: string) {
        return prisma.message.create({
            data: {
                chatId,
                senderId,
                receiverId,
                ciphertext,
                nonce
            }
        });
    },

    async getMessagesByChat(chatId: string) {
        return prisma.message.findMany({
            where: { chatId },
            orderBy: { createdAt: 'asc' }
        });
    }
};