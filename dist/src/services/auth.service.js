"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
// src/services/auth.service.ts
const client_1 = require("@prisma/client");
const bcrypt_1 = require("bcrypt");
const jwt_1 = require("../utils/jwt");
const prisma = new client_1.PrismaClient();
const SALT_ROUNDS = 10;
class AuthService {
    static async register(userData) {
        const { username, password, publicKey } = userData;
        const hashedPassword = await (0, bcrypt_1.hash)(password, SALT_ROUNDS);
        const user = await prisma.user.create({
            data: {
                username,
                passwordHash: hashedPassword,
                publicKey,
            },
        });
        return {
            user: { id: user.id, username: user.username },
            token: (0, jwt_1.generateToken)(user.id),
        };
    }
    static async login(username, password) {
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user)
            throw new Error('Usuario no encontrado');
        const passwordMatch = await (0, bcrypt_1.compare)(password, user.passwordHash);
        if (!passwordMatch)
            throw new Error('Contraseña incorrecta');
        return {
            user: { id: user.id, username: user.username },
            token: (0, jwt_1.generateToken)(user.id),
        };
    }
}
exports.AuthService = AuthService;
