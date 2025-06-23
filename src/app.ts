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

// Ruta catch-all para SPA
app.get('*', (req, res) => {
    const indexPath = path.join(staticDir, 'index.html');

    fs.readFile(indexPath, 'utf8', (err, html) => {
        if (err) {
            console.error('Error reading HTML file:', err);

            // Respuesta alternativa si index.html no existe
            return res.status(200).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Chat Protected</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        h1 { color: #333; }
                        p { color: #666; }
                        .status { color: #e74c3c; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <h1>Backend funcionando correctamente</h1>
                    <p>El frontend no está disponible en este momento</p>
                    <p class="status">Error: ${err.message}</p>
                    <p>Ruta intentada: ${indexPath}</p>
                </body>
                </html>
            `);
        }

        // Procesar HTML si es necesario
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