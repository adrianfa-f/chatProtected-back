import { z } from 'zod';

export const createChatSchema = z.object({
    otherUserId: z.string().uuid()
});

export type CreateChatInput = z.infer<typeof createChatSchema>;