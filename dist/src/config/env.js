"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RATE_LIMIT_MAX = exports.RATE_LIMIT_WINDOW_MS = exports.FRONTEND_URL = exports.JWT_EXPIRES_IN = exports.JWT_SECRET = exports.DATABASE_URL = exports.PORT = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.PORT = process.env.PORT || 4000;
exports.DATABASE_URL = process.env.DATABASE_URL || '';
exports.JWT_SECRET = process.env.JWT_SECRET || 'secret';
exports.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
exports.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
exports.RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS ? parseInt(process.env.RATE_LIMIT_WINDOW_MS) : 15 * 60 * 1000; // 15 minutes
exports.RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX) : 100;
console.log(`Configuración de entorno cargada:
  PORT: ${exports.PORT}
  FRONTEND_URL: ${exports.FRONTEND_URL}
  DATABASE_URL: ${exports.DATABASE_URL ? '*****' : 'no configurada'}`);
