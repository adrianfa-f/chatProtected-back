"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("./config/cors"));
const security_1 = __importDefault(require("./config/security"));
const rateLimit_middleware_1 = require("./middleware/rateLimit.middleware");
const error_middleware_1 = require("./middleware/error.middleware");
const routes_1 = __importDefault(require("./routes"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app = (0, express_1.default)();
// Middlewares
app.use(security_1.default);
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use(cors_1.default);
app.use(rateLimit_middleware_1.apiRateLimiter);
app.use('/api', routes_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});
// Determinar ruta base para archivos estáticos
const isProduction = process.env.NODE_ENV === 'production';
const staticDir = isProduction
    ? path_1.default.join(__dirname, 'client') // En producción: dist/client
    : path_1.default.join(__dirname, 'dist'); // En desarrollo: dist
console.log(`Serving static files from: ${staticDir}`);
// Servir archivos estáticos
app.use(express_1.default.static(staticDir, {
    setHeaders: (res, filePath) => {
        // Solo aplicar CSP a archivos HTML
        if (filePath.endsWith('.html')) {
            res.setHeader('Content-Security-Policy', "default-src 'self'");
        }
    }
}));
// Ruta catch-all para SPA
app.get('*', (req, res) => {
    const indexPath = path_1.default.join(staticDir, 'index.html');
    fs_1.default.readFile(indexPath, 'utf8', (err, html) => {
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
        const nonce = res.nonce || '';
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
app.use(error_middleware_1.notFoundHandler);
app.use(error_middleware_1.errorHandler);
console.log('Configuración de Express completada');
exports.default = app;
