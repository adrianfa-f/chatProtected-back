import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

export const ChatRequestService = {
    async createRequest(fromUserId: string, toUserId: string) {
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