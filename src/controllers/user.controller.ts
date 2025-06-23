import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

// Función para buscar usuarios
export const searchUsers = async (req: Request, res: Response) => {
    try {
        const query = req.query.query as string;
        const users = await UserService.searchUsers(query);

        res.status(200).json(users);
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Función para obtener clave pública
export const getUserPublicKey = async (req: Request, res: Response) => {
    try {
        const requestingUserId = req.body.userId; // Obtener ID del usuario autenticado
        const targetUserId = req.params.userId;    // ID del usuario solicitado

        const publicKey = await UserService.getUserPublicKey(
            requestingUserId,
            targetUserId
        );

        res.status(200).json({
            success: true,
            publicKey
        });
    } catch (error: any) {
        res.status(403).json({ // 403 Forbidden en lugar de 500
            success: false,
            error: error.message
        });
    }
};