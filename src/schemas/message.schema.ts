import { z } from 'zod';

export const sendMessageSchema = z.object({
    chatId: z.string().uuid(),
    receiverId: z.string().uuid(),
    ciphertext: z.string(),
    nonce: z.string().optional().nullable()
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;