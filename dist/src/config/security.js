"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/middlewares/security.ts (Versión mejorada)
const helmet_1 = __importDefault(require("helmet"));
const crypto_1 = __importDefault(require("crypto"));
const securityMiddleware = (req, res, next) => {
    const nonce = crypto_1.default.randomBytes(16).toString('base64');
    res.nonce = nonce;
    // 1. Configuración CSP mejorada
    const cspDirectives = {
        defaultSrc: ["'none'"],
        scriptSrc: ["'self'", `'nonce-${nonce}'`],
        styleSrc: ["'self'", `'nonce-${nonce}'`, "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'"],
        connectSrc: [
            "'self'",
            process.env.BACKEND_URL || 'http://localhost:4000',
            process.env.WEBSOCKET_URL || 'ws://localhost:3000'
        ],
        manifestSrc: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"]
    };
    // 2. Aplica CSP a TODAS las respuestas
    helmet_1.default.contentSecurityPolicy({
        directives: cspDirectives,
        reportOnly: false // Forzar cumplimiento en todos los entornos
    })(req, res, () => { });
    // 3. Headers de seguridad adicionales
    (0, helmet_1.default)({
        contentSecurityPolicy: false, // Ya lo configuramos manualmente
        xContentTypeOptions: true,
        xFrameOptions: { action: 'deny' },
        hsts: {
            maxAge: 63072000,
            includeSubDomains: true,
            preload: true
        },
        referrerPolicy: { policy: 'same-origin' }
    })(req, res, () => { });
    next();
};
exports.default = securityMiddleware;
