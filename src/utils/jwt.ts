import jwt from 'jsonwebtoken';
import { Request } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';

export const generateToken = (userId: string) => {
    return jwt.sign({ userId }, JWT_SECRET); // Eliminado expiresIn
};

export const verifyToken = (token: string) => {
    try {
        return jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch (error) {
        console.log("Error verificando token:", error);
        throw new Error('Token inválido');
    }
};