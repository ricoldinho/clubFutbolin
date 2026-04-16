"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FakePasswordHasher = void 0;
/**
 * Fake para tests: hash devuelve un prefijo + valor; verify comprueba ese prefijo.
 * No usar en producción.
 */
class FakePasswordHasher {
    constructor() {
        this.prefix = 'fake_hash_';
    }
    async hash(plain) {
        return this.prefix + plain;
    }
    async verify(plain, hash) {
        return hash === this.prefix + plain;
    }
}
exports.FakePasswordHasher = FakePasswordHasher;
