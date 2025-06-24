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
/* const isProduction = process.env.NODE_ENV === 'production';
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
})); */
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
