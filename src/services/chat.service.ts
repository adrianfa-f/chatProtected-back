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
        const chats = await prisma.chat.findMany({
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
                    orderBy: { createdAt: 'desc' } // 👈 Solo el último mensaje
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        const chatsWithExtras = await Promise.all(chats.map(async chat => {
            const unreadCount = await prisma.message.count({
                where: {
                    chatId: chat.id,
                    receiverId: userId,
                    status: 'delivered'
                }
            });

            const lastMessageObj = chat.messages?.[0];
            const lastMessage = lastMessageObj?.ciphertext || null; // O puedes usar plaintext si lo tienes

            return {
                ...chat,
                lastMessage,
                unreadCount
            };
        }));

        return chatsWithExtras;
    }


}