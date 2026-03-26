// src/shared/config/env.ts

import path from 'node:path';
import { existsSync } from 'node:fs';

/**
 * `.env` del monorepo (raíz del repo). Este archivo está en `apps/api/src/shared/config/`
 * → 5 niveles arriba. Tras `tsc`, queda en `dist/shared/config/` con la misma profundidad.
 */
const monorepoRootEnvPath = path.resolve(__dirname, '..', '..', '..', '..', '..', '.env');

/** Si no hay `.env` en la raíz, se intenta el del cwd (p. ej. `apps/api/.env`). */
const dotenvPath = existsSync(monorepoRootEnvPath)
  ? monorepoRootEnvPath
  : path.resolve(process.cwd(), '.env');

// 1. Definimos el Schema JSON estándar
// Esto validará que las variables existan y tengan el tipo correcto.
export const schema = {
  type: 'object',
  required: ['PORT', 'NODE_ENV', 'LOG_LEVEL'],
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
      default: 'dev-secret-change-in-production',
    },
    JWT_EXPIRES_IN: {
      type: 'string',
      default: '7d',
    },
  },
};

// 2. Definimos la Interfaz de TypeScript
// Esto nos dará autocompletado (IntelliSense) en todo el proyecto.
export interface Envs {
  PORT: number;
  NODE_ENV: string;
  LOG_LEVEL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
}

// 3. Opciones para el plugin de Fastify
export const options = {
  confKey: 'config', // Inyectará la config en server.config
  schema: schema,
  dotenv: {
    path: dotenvPath,
  },
  data: process.env, // Fallback
};
