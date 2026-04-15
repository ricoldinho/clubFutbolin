// This file is used by Prisma CLI (migrate/generate/seed).
// In a monorepo, ensure we load the correct `.env` from the repo root and from apps/api.
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

loadEnv({ path: resolve(__dirname, '../../.env') });
loadEnv({ path: resolve(__dirname, '.env') });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // Required by Prisma 7 when using `prisma db seed`
    seed: 'ts-node --project tsconfig.app.json --transpile-only -r tsconfig-paths/register prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
