// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AuthService } from '../services/auth.service';
import { RegisterInput } from '../schemas/user.schema';

// src/controllers/auth.controller.ts
// ... imports ...

export const register = async (req: Request, res: Response) => {
    try {
        const userData: RegisterInput = req.body;
        const result = await AuthService.register(userData);

        // Configurar cookie segura con token httpOnly
        res.cookie('authToken', result.token, {
            httpOnly: true,
            secure: true,
            /* secure: process.env.NODE_ENV === 'production', */
            sameSite: 'none',
            maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
            path: '/',
        });

        // CAMBIO: Enviar datos adicionales para sessionStorage
        res.status(StatusCodes.CREATED).json({
            success: true,
            data: {
                user: {
                    id: result.user.id,
                    username: result.user.username,
                }
            },
        });
    } catch (error: any) {
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            error: error.message,
        });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        const result = await AuthService.login(username, password);

        // Configurar cookie segura con token httpOnly
        res.cookie('authToken', result.token, {
            httpOnly: true,
            secure: true,
            /* secure: process.env.NODE_ENV === 'production', */
            sameSite: 'none',
            maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
            path: '/',
        });

        // CAMBIO: Enviar datos adicionales para sessionStorage
        res.status(StatusCodes.OK).json({
            success: true,
            data: {
                user: {
                    id: result.user.id,
                    username: result.user.username,
                }
            },
        });
    } catch (error: any) {
        res.status(StatusCodes.UNAUTHORIZED).json({
            success: false,
            error: error.message,
        });
    }
};

// logout permanece igual

export const logout = (req: Request, res: Response) => {
    // Eliminar cookie de autenticación
    res.clearCookie('authToken');
    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Sesión cerrada exitosamente',
    });
};
