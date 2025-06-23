import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class UserService {
    static async searchUsers(username: string) {
        return await prisma.user.findMany({
            where: {
                username: {
                    contains: username,
                    mode: 'insensitive'
                }
            },
            select: {
                id: true,
                username: true
            }
        });
    }

    static async getUserPublicKey(requestingUserId: string, targetUserId: string) {
        // Verificar si existe un chat entre los usuarios
        const chatExists = await prisma.chat.findFirst({
            where: {
                OR: [
                    { user1Id: requestingUserId, user2Id: targetUserId },
                    { user1Id: targetUserId, user2Id: requestingUserId }
                ]
            },
            select: { id: true }
        });

        if (!chatExists) {
            throw new Error('No tienes permiso para acceder a esta clave pública');
        }

        const user = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { publicKey: true }
        });

        return user?.publicKey || null;
    }
}