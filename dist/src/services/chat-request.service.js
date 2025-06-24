"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRequestService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.ChatRequestService = {
    async createRequest(fromUserId, toUserId) {
        // 🔍 Verificar si ya existe una solicitud pendiente entre estos dos usuarios
        const existingRequest = await prisma.chatRequest.findFirst({
            where: {
                fromUserId,
                toUserId,
                status: "pending", // ✅ Solo si aún no ha sido aceptada/rechazada
            },
        });
        if (existingRequest) {
            throw new Error("Ya existe una solicitud de chat pendiente entre estos usuarios.");
        }
        // 🔥 Si no existe, crear una nueva solicitud
        return prisma.chatRequest.create({
            data: {
                fromUserId,
                toUserId,
                status: "pending",
            },
        });
    }
};
