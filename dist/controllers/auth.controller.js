"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.login = exports.register = void 0;
const http_status_codes_1 = require("http-status-codes");
const auth_service_1 = require("../services/auth.service");
// src/controllers/auth.controller.ts
// ... imports ...
const register = async (req, res) => {
    try {
        const userData = req.body;
        const result = await auth_service_1.AuthService.register(userData);
        // Configurar cookie segura con token httpOnly
        res.cookie('authToken', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000, // 1 día
            path: '/',
        });
        // CAMBIO: Enviar datos adicionales para sessionStorage
        res.status(http_status_codes_1.StatusCodes.CREATED).json({
            success: true,
            data: {
                user: {
                    id: result.user.id,
                    username: result.user.username,
                }
            },
        });
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
            success: false,
            error: error.message,
        });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await auth_service_1.AuthService.login(username, password);
        // Configurar cookie segura con token httpOnly
        res.cookie('authToken', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000, // 1 día
            path: '/',
        });
        // CAMBIO: Enviar datos adicionales para sessionStorage
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: {
                user: {
                    id: result.user.id,
                    username: result.user.username,
                }
            },
        });
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
            success: false,
            error: error.message,
        });
    }
};
exports.login = login;
// logout permanece igual
const logout = (req, res) => {
    // Eliminar cookie de autenticación
    res.clearCookie('authToken');
    res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        message: 'Sesión cerrada exitosamente',
    });
};
exports.logout = logout;
