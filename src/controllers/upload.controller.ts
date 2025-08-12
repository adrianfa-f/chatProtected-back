import { Request, Response } from "express";
import { processFile, getFilesByChat } from "../services/upload.service";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


export const uploadHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { chatId, senderId, receiverId } = req.body;
        const savedFile = await processFile({
            file: req.file,
            chatId,
            senderId,
            receiverId,
        });
        res.status(201).json({ message: "Archivo guardado", file: savedFile });
    } catch (err) {
        res.status(400).json({ error: (err as Error).message });
    }
};

export const getFilesHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { chatId } = req.params;
        if (!chatId || typeof chatId !== "string") {
            res.status(400).json({ error: "chatId requerido" });
            return;
        }

        const files = await getFilesByChat(chatId);
        res.status(200).json(files);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener archivos" });
    }
};

export const createLinkHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { chatId, senderId, receiverId, url } = req.body;

        const savedLink = await prisma.mediaFile.create({
            data: {
                chatId,
                senderId,
                receiverId,
                filename: 'Enlace',
                mimetype: 'text/uri-list',
                size: 0,
                url,
                fileType: 'link'
            },
        });

        res.status(201).json({ message: "Enlace guardado", file: savedLink });
    } catch (err) {
        res.status(400).json({ error: (err as Error).message });
    }
};
