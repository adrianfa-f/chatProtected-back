import http from 'http';
import app from './app';
import { PORT } from './config/env';
import { PrismaClient } from '@prisma/client';
import { setupWebSocket } from './server/websocket';

const prisma = new PrismaClient();

const startServer = async () => {
    try {
        await prisma.$connect();
        console.log('✅ Conexión a la base de datos establecida');

        const server = http.createServer(app);
        setupWebSocket(server);

        server.listen(PORT, () => {
            console.log(`🚀 Servidor HTTP y WebSocket corriendo en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Error al conectar con la base de datos:', error);
        process.exit(1);
    }
};

startServer();