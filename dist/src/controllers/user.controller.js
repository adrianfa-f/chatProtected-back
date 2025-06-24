"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserPublicKey = exports.searchUsers = void 0;
const user_service_1 = require("../services/user.service");
// Función para buscar usuarios
const searchUsers = async (req, res) => {
    try {
        const query = req.query.query;
        const users = await user_service_1.UserService.searchUsers(query);
        res.status(200).json(users);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
exports.searchUsers = searchUsers;
// Función para obtener clave pública
const getUserPublicKey = async (req, res) => {
    try {
        const requestingUserId = req.body.userId; // Obtener ID del usuario autenticado
        const targetUserId = req.params.userId; // ID del usuario solicitado
        const publicKey = await user_service_1.UserService.getUserPublicKey(requestingUserId, targetUserId);
        res.status(200).json({
            success: true,
            publicKey
        });
    }
    catch (error) {
        res.status(403).json({
            success: false,
            error: error.message
        });
    }
};
exports.getUserPublicKey = getUserPublicKey;
