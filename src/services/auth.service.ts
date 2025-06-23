// src/services/auth.service.ts
import { PrismaClient } from '@prisma/client';
import { hash, compare } from 'bcrypt';
import { generateToken } from '../utils/jwt';
import { RegisterInput } from '../schemas/user.schema';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

export class AuthService {
    static async register(userData: RegisterInput) {
        const { username, password, publicKey } = userData;

        const hashedPassword = await hash(password, SALT_ROUNDS);
        const user = await prisma.user.create({
            data: {
                username,
                passwordHash: hashedPassword,
                publicKey,
            },
        });

        return {
            user: { id: user.id, username: user.username },
            token: generateToken(user.id),
        };
    }

    static async login(username: string, password: string) {
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) throw new Error('Usuario no encontrado');

        const passwordMatch = await compare(password, user.passwordHash);
        if (!passwordMatch) throw new Error('Contraseña incorrecta');

        return {
            user: { id: user.id, username: user.username },
            token: generateToken(user.id),
        };
    }
}
