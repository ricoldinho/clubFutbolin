/**
 * Global setup para tests de integración: aplica migraciones Prisma a la BD de test.
 * Se ejecuta una vez antes de toda la suite. Requiere DATABASE_URL_TEST en .env
 * y Postgres de test levantado (docker compose -f docker-compose.test.yml up -d).
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

function loadEnv(): void {
  const path = resolve(process.cwd(), '.env');
  if (!existsSync(path)) return;
  const content = readFileSync(path, 'utf-8');
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

  const urlTest = process.env.DATABASE_URL_TEST;
  if (!urlTest) {
    throw new Error(
      'DATABASE_URL_TEST no está definida. Añádela a .env (ver .env.example) y levanta el Postgres de test: docker compose -f docker-compose.test.yml up -d',
    );
  }

  process.env.DATABASE_URL = urlTest;

  // Si la BD de test tiene una migración marcada como fallida (P3009), hay que limpiarla una vez
  // desde tu terminal (fuera de Cursor): DATABASE_URL=<tu DATABASE_URL_TEST> npx prisma migrate reset --force
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: process.env,
  });
}
