"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
/**
 * Comprueba que el setup de integración inyectó la BD de test.
 * Si este test falla, revisa DATABASE_URL_TEST en .env y que el Postgres de test esté levantado.
 */
(0, vitest_1.describe)('setup integración', () => {
    (0, vitest_1.it)('usa la BD de test (DATABASE_URL = DATABASE_URL_TEST)', () => {
        (0, vitest_1.expect)(process.env.DATABASE_URL).toBeDefined();
        (0, vitest_1.expect)(process.env.DATABASE_URL).toBe(process.env.DATABASE_URL_TEST);
        (0, vitest_1.expect)(process.env.DATABASE_URL).toContain('clubfutbolin_test');
    });
});
