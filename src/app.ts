import express from 'express';
import cors from './config/cors';
import securityMiddleware from './config/security';
import { apiRateLimiter } from './middleware/rateLimit.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import apiRouter from './routes';
import path from 'path';
import fs from 'fs';
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

// Determinar ruta base para archivos estáticos
const isProduction = process.env.NODE_ENV === 'production';
const staticDir = isProduction
    ? path.join(__dirname, 'client')   // En producción: dist/client
    : path.join(__dirname, 'dist');    // En desarrollo: dist

console.log(`Serving static files from: ${staticDir}`);

// Servir archivos estáticos
app.use(express.static(staticDir, {
    setHeaders: (res, filePath) => {
        // Solo aplicar CSP a archivos HTML
        if (filePath.endsWith('.html')) {
            res.setHeader('Content-Security-Policy', "default-src 'self'");
        }
    }
}));

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