import { describe, it, expect } from 'vitest';

/**
 * Comprueba que el setup de integración inyectó la BD de test.
 * Si este test falla, revisa DATABASE_URL_TEST en .env y que el Postgres de test esté levantado.
 */
describe('setup integración', () => {
  it('usa la BD de test (DATABASE_URL = DATABASE_URL_TEST)', () => {
    expect(process.env.DATABASE_URL).toBeDefined();
    expect(process.env.DATABASE_URL).toBe(process.env.DATABASE_URL_TEST);
    expect(process.env.DATABASE_URL).toContain('clubfutbolin_test');
  });
});
