"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const BcryptPasswordHasher_1 = require("@/adapters/auth/BcryptPasswordHasher");
(0, vitest_1.describe)('BcryptPasswordHasher', () => {
    const hasher = new BcryptPasswordHasher_1.BcryptPasswordHasher();
    (0, vitest_1.it)('hash devuelve un string distinto al plain', async () => {
        const plain = 'mySecretPassword123';
        const hashed = await hasher.hash(plain);
        (0, vitest_1.expect)(hashed).not.toBe(plain);
        (0, vitest_1.expect)(typeof hashed).toBe('string');
        (0, vitest_1.expect)(hashed.length).toBeGreaterThan(0);
    });
    (0, vitest_1.it)('verify devuelve true cuando el plain coincide con el hash', async () => {
        const plain = 'password123';
        const hashed = await hasher.hash(plain);
        const ok = await hasher.verify(plain, hashed);
        (0, vitest_1.expect)(ok).toBe(true);
    });
    (0, vitest_1.it)('verify devuelve false cuando el plain no coincide', async () => {
        const plain = 'password123';
        const hashed = await hasher.hash(plain);
        const ok = await hasher.verify('wrongPassword', hashed);
        (0, vitest_1.expect)(ok).toBe(false);
    });
    (0, vitest_1.it)('hash genera valores distintos para la misma entrada (salt)', async () => {
        const plain = 'samePassword';
        const h1 = await hasher.hash(plain);
        const h2 = await hasher.hash(plain);
        (0, vitest_1.expect)(h1).not.toBe(h2);
        (0, vitest_1.expect)(await hasher.verify(plain, h1)).toBe(true);
        (0, vitest_1.expect)(await hasher.verify(plain, h2)).toBe(true);
    });
});
