"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class ChatService {
    static async createChat(user1Id, user2Id) {
        // Ordenar IDs para evitar chats duplicados
        const [id1, id2] = [user1Id, user2Id].sort();
        return await prisma.chat.create({
            data: {
                user1Id: id1,
                user2Id: id2
            },
            include: {
                user1: true,
                user2: true
            }
        });
    }
    static async getUserChats(userId) {
        return await prisma.chat.findMany({
            where: {
                OR: [
                    { user1Id: userId },
                    { user2Id: userId }
                ]
            },
            include: {
                user1: true,
                user2: true,
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
    }
    ;
}
exports.ChatService = ChatService;
