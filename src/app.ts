import express from 'express';
import cors from './config/cors';
import securityMiddleware from './config/security';
import { apiRateLimiter } from './middleware/rateLimit.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import apiRouter from './routes';
import cookieParser from 'cookie-parser';

const app = express();

// Middlewares
app.use(securityMiddleware);
app.use(express.json());
app.use(cookieParser());
app.use(cors);
app.use(apiRateLimiter);

app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Middleware para eliminar parámetros sensibles de URLs
app.use((req, res, next) => {
    const sensitiveParams = ['token', 'password', 'secret'];
    sensitiveParams.forEach(param => {
        if (req.query[param]) {
            delete req.query[param];
        }
    });
    next();
});

// Manejo de errores
app.use(notFoundHandler);
app.use(errorHandler);

console.log('Configuración de Express completada');

export default app;