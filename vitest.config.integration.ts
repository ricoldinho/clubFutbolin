import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Configuración solo para tests de integración (usan BD real).
 * Ejecutar con: npm run test:integration
 * Requiere: Docker con Postgres de test levantado y DATABASE_URL_TEST en .env
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    globals: false,
    globalSetup: ['vitest.globalSetup.integration.ts'],
    setupFiles: ['vitest.setup.integration.ts'],
    isolate: true,
    testTimeout: 10_000,
    hookTimeout: 15_000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
