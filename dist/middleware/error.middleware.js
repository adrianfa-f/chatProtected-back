"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const http_status_codes_1 = require("http-status-codes");
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    // Monitoreo de actividad sospechosa
    if (err.name === 'UnauthorizedError') {
        // Registrar intento de acceso no autorizado
        console.warn(`Intento de acceso no autorizado desde ${req.ip}`);
    }
    res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Error interno del servidor',
        message: err.message,
    });
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
        error: 'Endpoint no encontrado',
    });
};
exports.notFoundHandler = notFoundHandler;
