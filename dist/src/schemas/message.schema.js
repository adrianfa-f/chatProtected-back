"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageSchema = void 0;
const zod_1 = require("zod");
exports.sendMessageSchema = zod_1.z.object({
    chatId: zod_1.z.string().uuid(),
    receiverId: zod_1.z.string().uuid(),
    ciphertext: zod_1.z.string(),
    nonce: zod_1.z.string().optional().nullable()
});
