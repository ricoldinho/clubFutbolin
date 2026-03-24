/**
 * Setup para tests de integración: usa la BD de test.
 * Carga `.env` desde la raíz del monorepo y deja DATABASE_URL apuntando a DATABASE_URL_TEST.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

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

loadEnv();

const urlTest = process.env.DATABASE_URL_TEST;
if (!urlTest) {
  throw new Error(
    'DATABASE_URL_TEST no está definida. Añádela a .env en la raíz del monorepo (ver .env.example) y levanta el Postgres de test: docker compose -f docker-compose.test.yml up -d',
  );
}

process.env.DATABASE_URL = urlTest;
