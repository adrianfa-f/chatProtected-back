import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error(err.stack);

    // Monitoreo de actividad sospechosa
    if (err.name === 'UnauthorizedError') {
        // Registrar intento de acceso no autorizado
        console.warn(`Intento de acceso no autorizado desde ${req.ip}`);
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Error interno del servidor',
        message: err.message,
    });
};

export const notFoundHandler = (req: Request, res: Response) => {
    res.status(StatusCodes.NOT_FOUND).json({
        error: 'Endpoint no encontrado',
    });
};