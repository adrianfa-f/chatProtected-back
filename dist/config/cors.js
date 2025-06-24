"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./env");
const corsOptions = {
    origin: env_1.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};
console.log(`Configurando CORS para Express para permitir origen: ${env_1.FRONTEND_URL}`);
exports.default = (0, cors_1.default)(corsOptions);
