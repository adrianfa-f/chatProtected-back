import { PrismaClient } from "@prisma/client";
import cloudinary from "../utils/cloudinary";
import { UploadApiResponse } from 'cloudinary';

const prisma = new PrismaClient();

interface UploadParams {
    file?: Express.Multer.File;
    chatId: string;
    senderId: string;
    receiverId: string;
}

export const processFile = async ({ file, chatId, senderId, receiverId }: UploadParams) => {
    if (!file) throw new Error("No file uploaded");

    try {
        // Determinar tipo de recurso basado en el MIME type
        const resourceType = file.mimetype.startsWith('image/') ? 'image' : 'raw';

        // Subir el archivo con el resourceType correcto
        const result = await cloudinary.uploader.upload(
            `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
            {
                resource_type: resourceType, // ¡Clave para documentos!
                folder: resourceType === 'image' ? "media" : "docs"
            }
        );

        // Determinar tipo de archivo para nuestra DB
        const fileType = resourceType === 'image' ? 'image' : 'file';

        // Crear registro en base de datos
        const savedFile = await prisma.mediaFile.create({
            data: {
                chatId,
                senderId,
                receiverId,
                filename: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                url: result.secure_url,
                fileType
            },
        });

        return savedFile;
    } catch (err) {
        console.error('Error processing file:', err);
        throw new Error('Error al procesar el archivo');
    }
};

export const getFilesByChat = async (chatId: string) => {
    return await prisma.mediaFile.findMany({
        where: { chatId },
        orderBy: { createdAt: "asc" },
    });
};