import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ChatService {
    static async createChat(user1Id: string, user2Id: string) {
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

    static async getUserChats(userId: string) {
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
    };
}