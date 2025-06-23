import { z } from 'zod';

export const registerSchema = z.object({
    username: z.string().min(3).max(20),
    password: z.string().min(8),
    publicKey: z.string() // Nueva propiedad
});

export const loginSchema = z.object({
    username: z.string().min(3).max(20),
    password: z.string().min(8),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;