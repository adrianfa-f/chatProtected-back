import rateLimit from 'express-rate-limit';
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX } from '../config/env';

export const apiRateLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX,
    message: 'Demasiadas solicitudes desde esta IP, por favor inténtalo de nuevo más tarde',
    standardHeaders: true,
    legacyHeaders: false,
});