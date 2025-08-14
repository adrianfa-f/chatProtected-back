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
        // Determinar tipo de archivo
        let resourceType: 'image' | 'video' | 'raw' = 'raw';
        let fileType: 'image' | 'file' | 'video' | 'audio' = 'file';

        if (file.mimetype.startsWith('image/')) {
            resourceType = 'image';
            fileType = 'image';
        } else if (file.mimetype.startsWith('video/')) {
            resourceType = 'video';
            fileType = 'video';
        } else if (file.mimetype.startsWith('audio/')) {
            resourceType = 'video'; // Cloudinary trata audio como video
            fileType = 'audio';
        }

        const result = await cloudinary.uploader.upload(
            `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
            {
                resource_type: resourceType,
                folder: "media",
                public_id: file.originalname.replace(/\.[^/.]+$/, ""),
                use_filename: true,
                unique_filename: false
            }
        );

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