// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
    console.log('Cookies recibidas:', req.cookies);
    // CAMBIO: Obtener token SOLO de la cookie
    const token = req.cookies?.authToken;

    if (!token) {
        console.error('Token no encontrado en cookies');
        res.status(401).json({ error: 'Acceso no autorizado' });
        return;
    }

    try {
        const decoded = verifyToken(token);
        console.log('Token decodificado:', decoded);
        // Adjuntar el userId al request
        req.body = req.body || {};
        req.body.userId = decoded.userId;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Token inválido o expirado' });
        return;
    }
};

export const authorize = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Implementar validación de roles según sea necesario
        next();
    };
};
