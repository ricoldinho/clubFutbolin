"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jose = __importStar(require("jose"));
const JoseJwtService_1 = require("@/adapters/auth/JoseJwtService");
const SECRET = 'test-secret-key';
const EXPIRES_IN = '1h';
(0, vitest_1.describe)('JoseJwtService', () => {
    const jwtService = new JoseJwtService_1.JoseJwtService(SECRET, EXPIRES_IN);
    (0, vitest_1.it)('sign devuelve un token string', async () => {
        const token = await jwtService.sign({
            sub: 'player-uuid-123',
            email: 'a@b.com',
            role: 'USER',
        });
        (0, vitest_1.expect)(typeof token).toBe('string');
        (0, vitest_1.expect)(token.split('.')).toHaveLength(3); // JWT tiene 3 partes
    });
    (0, vitest_1.it)('verify devuelve payload cuando el token es válido', async () => {
        const token = await jwtService.sign({
            sub: 'player-uuid-456',
            role: 'ADMIN',
        });
        const payload = await jwtService.verify(token);
        (0, vitest_1.expect)(payload).not.toBeNull();
        (0, vitest_1.expect)(payload.sub).toBe('player-uuid-456');
        (0, vitest_1.expect)(payload.role).toBe('ADMIN');
        (0, vitest_1.expect)(payload.tokenType).toBe('access');
    });
    (0, vitest_1.it)('verify devuelve null cuando el token es inválido', async () => {
        const payload = await jwtService.verify('invalid.token.here');
        (0, vitest_1.expect)(payload).toBeNull();
    });
    (0, vitest_1.it)('verify devuelve null cuando el token está malformado', async () => {
        const payload = await jwtService.verify('not-a-jwt');
        (0, vitest_1.expect)(payload).toBeNull();
    });
    (0, vitest_1.it)('verify devuelve null cuando el token está firmado con otro secret', async () => {
        const otherService = new JoseJwtService_1.JoseJwtService('other-secret', EXPIRES_IN);
        const token = await otherService.sign({ sub: 'id', role: 'USER' });
        const payload = await jwtService.verify(token);
        (0, vitest_1.expect)(payload).toBeNull();
    });
    (0, vitest_1.it)('verify devuelve null cuando sub no es string', async () => {
        const secret = new TextEncoder().encode(SECRET);
        const token = await new jose.SignJWT({ sub: 123, role: 'USER' })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime(EXPIRES_IN)
            .sign(secret);
        const payload = await jwtService.verify(token);
        (0, vitest_1.expect)(payload).toBeNull();
    });
    (0, vitest_1.it)('verify devuelve null cuando role no es string', async () => {
        const secret = new TextEncoder().encode(SECRET);
        const token = await new jose.SignJWT({ sub: 'player-id', role: 123 })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime(EXPIRES_IN)
            .sign(secret);
        const payload = await jwtService.verify(token);
        (0, vitest_1.expect)(payload).toBeNull();
    });
    (0, vitest_1.it)('getExpiresIn devuelve el valor configurado', () => {
        (0, vitest_1.expect)(jwtService.getExpiresIn()).toBe(EXPIRES_IN);
    });
    (0, vitest_1.it)('verify respeta expectedTokenType y devuelve null si no coincide', async () => {
        // Arrange
        const refreshToken = await jwtService.sign({
            sub: 'player-uuid-789',
            role: 'USER',
            tokenType: 'refresh',
        }, { expiresIn: '14d' });
        // Act
        const shouldFail = await jwtService.verify(refreshToken, 'access');
        const shouldPass = await jwtService.verify(refreshToken, 'refresh');
        // Assert
        (0, vitest_1.expect)(shouldFail).toBeNull();
        (0, vitest_1.expect)(shouldPass).toMatchObject({
            sub: 'player-uuid-789',
            role: 'USER',
            tokenType: 'refresh',
        });
    });
});
