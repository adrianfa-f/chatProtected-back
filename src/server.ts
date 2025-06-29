import http from 'http';
import app from './app';
import { PORT } from './config/env';
import { PrismaClient } from '@prisma/client';
import { setupWebSocket } from './server/websocket';

const prisma = new PrismaClient();

const startServer = async () => {
    try {
        await prisma.$connect();
        console.log('✅ Conexión a DB establecida');

        const server = http.createServer(app);
        setupWebSocket(server);

        server.listen(PORT, () => {
            console.log(`🚀 Servidor HTTP/WS en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Error con la DB:', error);
        process.exit(1);
    }
};

startServer();