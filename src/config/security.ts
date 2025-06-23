// src/middlewares/security.ts (Versión mejorada)
import helmet from 'helmet';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

declare global {
    namespace Express {
        interface Response {
            nonce?: string;
        }
    }
}

const securityMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const nonce = crypto.randomBytes(16).toString('base64');
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
    helmet.contentSecurityPolicy({
        directives: cspDirectives,
        reportOnly: false // Forzar cumplimiento en todos los entornos
    })(req, res, () => { });

    // 3. Headers de seguridad adicionales
    helmet({
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

export default securityMiddleware;