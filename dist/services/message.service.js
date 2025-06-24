"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.default = {
    async createMessage(chatId, senderId, receiverId, ciphertext, nonce) {
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
    async getMessagesByChat(chatId) {
        return prisma.message.findMany({
            where: { chatId },
            orderBy: { createdAt: 'asc' }
        });
    }
};
