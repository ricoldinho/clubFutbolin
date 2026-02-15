// src/config/env.ts

// 1. Definimos el Schema JSON estándar
// Esto validará que las variables existan y tengan el tipo correcto.
export const schema = {
  type: "object",
  required: ["PORT", "NODE_ENV", "LOG_LEVEL"],
  properties: {
    PORT: {
      type: "integer",
      default: 3000,
    },
    NODE_ENV: {
      type: "string",
      default: "development",
    },
    LOG_LEVEL: {
      type: "string",
      default: "info",
    },
  },
};

// 2. Definimos la Interfaz de TypeScript
// Esto nos dará autocompletado (IntelliSense) en todo el proyecto.
export interface Envs {
  PORT: number;
  NODE_ENV: string;
  LOG_LEVEL: string;
}

// 3. Opciones para el plugin de Fastify
export const options = {
  confKey: "config", // Inyectará la config en server.config
  schema: schema,
  dotenv: true, // Leerá automáticamente el archivo .env
  data: process.env, // Fallback
};
