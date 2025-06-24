"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const client_1 = require("@prisma/client");
const websocket_1 = require("./server/websocket");
const prisma = new client_1.PrismaClient();
const startServer = async () => {
    try {
        await prisma.$connect();
        console.log('Conexión a la base de datos establecida');
        // Crear servidor HTTP usando Express
        const server = http_1.default.createServer(app_1.default);
        // Configurar WebSocket pasando el servidor HTTP
        (0, websocket_1.setupWebSocket)(server);
        // Iniciar servidor
        server.listen(env_1.PORT, () => {
            console.log(`Servidor HTTP y WebSocket corriendo en http://localhost:${env_1.PORT}`);
        });
    }
    catch (error) {
        console.error('Error al conectar con la base de datos:', error);
        process.exit(1);
    }
};
startServer();
