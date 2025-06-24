"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class UserService {
    static async searchUsers(username) {
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
    static async getUserPublicKey(requestingUserId, targetUserId) {
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
exports.UserService = UserService;
