"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const authenticate = (req, res, next) => {
    // CAMBIO: Obtener token SOLO de la cookie
    const token = req.cookies?.authToken;
    if (!token) {
        res.status(401).json({ error: 'Acceso no autorizado' });
        return;
    }
    try {
        const decoded = (0, jwt_1.verifyToken)(token);
        // Adjuntar el userId al request
        req.body = req.body || {};
        req.body.userId = decoded.userId;
        next();
    }
    catch (err) {
        res.status(401).json({ error: 'Token inválido o expirado' });
        return;
    }
};
exports.authenticate = authenticate;
const authorize = (roles) => {
    return (req, res, next) => {
        // Implementar validación de roles según sea necesario
        next();
    };
};
exports.authorize = authorize;
