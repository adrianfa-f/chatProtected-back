import jwt from 'jsonwebtoken';
import { Request } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';
const TOKEN_EXPIRATION = '1d';

export const generateToken = (userId: string) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
};

export const verifyToken = (token: string) => {
    try {
        return jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch (error) {
        console.log("Este es el error que estamos recibiendo: ", error)
        throw new Error('Token inválido o expirado');
    }
};