"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequestShema = void 0;
const zod_1 = require("zod");
exports.createRequestShema = zod_1.z.object({
    toUserId: zod_1.z.string()
});
