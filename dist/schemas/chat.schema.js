"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChatSchema = void 0;
const zod_1 = require("zod");
exports.createChatSchema = zod_1.z.object({
    otherUserId: zod_1.z.string().uuid()
});
