/**
 * Global setup para tests de integración: aplica migraciones pendientes (`migrate deploy`).
 * Si la BD de test está en estado incoherente (P3018, “already exists”), ver recuperación en `docs/testing-db.md`.
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

  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: process.env,
  });
}
