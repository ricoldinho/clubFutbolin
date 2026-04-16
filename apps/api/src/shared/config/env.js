"use strict";
// src/shared/config/env.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.options = exports.schema = exports.INSECURE_JWT_SECRETS = void 0;
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = require("node:fs");
/**
 * Secretos JWT inseguros conocidos (plantillas/legacy) que nunca deben usarse en producción.
 */
exports.INSECURE_JWT_SECRETS = new Set([
    'dev-secret-change-in-production',
    'dev-secret-change-in-production-1234567890',
]);
/**
 * Ruta del `.env` con fallback robusto para distintos contextos de ejecución:
 * - `npm run ... -w @clubfutbolin/api` (cwd = `apps/api`)
 * - ejecución desde raíz del monorepo
 * - build bundled (tsup), donde `__dirname` cambia respecto a `src/`
 */
const dotenvCandidates = [
    node_path_1.default.resolve(process.cwd(), '.env'),
    node_path_1.default.resolve(process.cwd(), '..', '.env'),
    node_path_1.default.resolve(process.cwd(), '..', '..', '.env'),
    node_path_1.default.resolve(__dirname, '..', '..', '..', '..', '..', '.env'),
];
const dotenvPath = dotenvCandidates.find((candidate) => (0, node_fs_1.existsSync)(candidate))
    ?? node_path_1.default.resolve(process.cwd(), '.env');
// 1. Definimos el Schema JSON estándar
// Esto validará que las variables existan y tengan el tipo correcto.
exports.schema = {
    type: 'object',
    required: ['PORT', 'NODE_ENV', 'LOG_LEVEL', 'JWT_SECRET', 'JWT_EXPIRES_IN', 'JWT_REFRESH_EXPIRES_IN'],
    properties: {
        PORT: {
            type: 'integer',
            default: 3000,
        },
        NODE_ENV: {
            type: 'string',
            default: 'development',
        },
        LOG_LEVEL: {
            type: 'string',
            default: 'info',
        },
        JWT_SECRET: {
            type: 'string',
            minLength: 32,
        },
        JWT_EXPIRES_IN: {
            type: 'string',
            default: '7d',
        },
        JWT_REFRESH_EXPIRES_IN: {
            type: 'string',
            default: '14d',
        },
        CORS_ORIGINS: {
            type: 'string',
            default: 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173',
        },
        RATE_LIMIT_MAX: {
            type: 'integer',
            default: 200,
        },
        RATE_LIMIT_WINDOW_MS: {
            type: 'integer',
            default: 60000,
        },
        AUTH_RATE_LIMIT_MAX: {
            type: 'integer',
            default: 10,
        },
        AUTH_RATE_LIMIT_WINDOW_MS: {
            type: 'integer',
            default: 60000,
        },
        AUTH_ACCESS_COOKIE_NAME: {
            type: 'string',
            default: 'clubfutbolin_at',
        },
        AUTH_REFRESH_COOKIE_NAME: {
            type: 'string',
            default: 'clubfutbolin_rt',
        },
        AUTH_ACCESS_COOKIE_MAX_AGE_SEC: {
            type: 'integer',
            default: 900,
        },
        AUTH_REFRESH_COOKIE_MAX_AGE_SEC: {
            type: 'integer',
            default: 1209600,
        },
        AUTH_COOKIE_SAME_SITE: {
            type: 'string',
            default: 'lax',
        },
        AUTH_COOKIE_SECURE: {
            type: 'boolean',
            default: false,
        },
    },
};
// 3. Opciones para el plugin de Fastify
exports.options = {
    confKey: 'config', // Inyectará la config en server.config
    schema: exports.schema,
    dotenv: {
        path: dotenvPath,
    },
    data: process.env, // Fallback
};
