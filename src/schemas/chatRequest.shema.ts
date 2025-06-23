import { z } from "zod";

export const createRequestShema = z.object({
    toUserId: z.string()
});

export type CreateRequestInput = z.infer<typeof createRequestShema>