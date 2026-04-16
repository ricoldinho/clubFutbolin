"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BcryptPasswordHasher = void 0;
const bcrypt_1 = require("bcrypt");
const SALT_ROUNDS = 10;
class BcryptPasswordHasher {
    async hash(plain) {
        return (0, bcrypt_1.hash)(plain, SALT_ROUNDS);
    }
    async verify(plain, hash) {
        return (0, bcrypt_1.compare)(plain, hash);
    }
}
exports.BcryptPasswordHasher = BcryptPasswordHasher;
