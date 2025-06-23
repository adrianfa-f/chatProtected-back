import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT || 4000;
export const DATABASE_URL = process.env.DATABASE_URL || '';
export const JWT_SECRET = process.env.JWT_SECRET || 'secret';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
export const RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS ? parseInt(process.env.RATE_LIMIT_WINDOW_MS) : 15 * 60 * 1000; // 15 minutes
export const RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX) : 100;

console.log(`Configuración de entorno cargada:
  PORT: ${PORT}
  FRONTEND_URL: ${FRONTEND_URL}
  DATABASE_URL: ${DATABASE_URL ? '*****' : 'no configurada'}`);