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

    let result: UploadApiResponse;
    let fileType = 'file';

    try {
        // Manejar imágenes
        if (file.mimetype.startsWith('image/')) {
            const base64Image = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
            result = await cloudinary.uploader.upload(base64Image, { folder: "media" });
            fileType = 'image';
        }
        // Manejar documentos
        else {
            // Envolver en promesa para obtener la respuesta correctamente
            result = await new Promise<UploadApiResponse>((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { resource_type: 'auto', folder: "docs" },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result as UploadApiResponse);
                    }
                );

                uploadStream.end(file.buffer);
            });
        }

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