import cors from 'cors';
import { FRONTEND_URL } from './env';

const corsOptions = {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};

console.log(`Configurando CORS para Express para permitir origen: ${FRONTEND_URL}`);

export default cors(corsOptions);