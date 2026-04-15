/**
 * Global setup para tests de integración: aplica migraciones pendientes (`migrate deploy`).
 * Si la BD de test está en estado incoherente (P3018, “already exists”), ver recuperación en `docs/testing-db.md`.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv(): void {
  /** Raíz del monorepo: este archivo vive en `apps/api/`. */
  const envPath = resolve(__dirname, '..', '..', '.env');
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
      value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}

export default function globalSetup(): void {
  loadEnv();

  // Defaults mínimos para levantar Fastify con env-schema durante integración.
  process.env.PORT = process.env.PORT ?? '3000';
  process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
  process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? 'silent';
  process.env.JWT_SECRET =
    process.env.JWT_SECRET ?? 'dev-secret-change-in-production-1234567890';
  process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d';
  process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? '14d';

  const urlTest = process.env.DATABASE_URL_TEST;
  if (!urlTest) {
    throw new Error(
      'DATABASE_URL_TEST no está definida. Añádela a .env en la raíz del monorepo (ver .env.example) y levanta el Postgres de test: docker compose -f docker-compose.test.yml up -d',
    );
  }

  process.env.DATABASE_URL = urlTest;

  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: process.env,
    cwd: __dirname,
  });
}
