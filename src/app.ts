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

// Servir archivos estáticos (build de Vite)
app.use('/assets', express.static(path.join(__dirname, 'dist', 'assets'), {
    setHeaders: (res) => {
        res.setHeader('Content-Security-Policy', "default-src 'self'");
    }
}));

app.get(/^(?!\/api).*/, (req, res) => {
    const filePath = path.join(__dirname, 'dist', 'index.html');

    fs.readFile(filePath, 'utf8', (err, html) => {
        if (err) {
            console.error('Error reading HTML file:', err);
            return res.status(500).send('Server error');
        }

        const nonce = (res as any).nonce || '';
        const processedHtml = html
            .replace(/<script(?=[ >])/g, `<script nonce="${nonce}"`)
            .replace(/<style(?=[ >])/g, `<style nonce="${nonce}"`);

        res.send(processedHtml);
    });
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