"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const errors_1 = require("@/domain/shared/errors");
(0, vitest_1.describe)('DomainValidationError', () => {
    (0, vitest_1.it)('crea error con nombre y mensaje', () => {
        const err = new errors_1.DomainValidationError('Campo inválido');
        (0, vitest_1.expect)(err.name).toBe('DomainValidationError');
        (0, vitest_1.expect)(err.message).toBe('Campo inválido');
    });
});
(0, vitest_1.describe)('NotFoundError', () => {
    (0, vitest_1.it)('crea error con entidad y criterio opcional', () => {
        const err = new errors_1.NotFoundError('Player', 'id-123');
        (0, vitest_1.expect)(err.name).toBe('NotFoundError');
        (0, vitest_1.expect)(err.message).toContain('Player');
        (0, vitest_1.expect)(err.message).toContain('id-123');
    });
    (0, vitest_1.it)('crea error solo con entidad cuando no se pasa criterio', () => {
        const err = new errors_1.NotFoundError('Player');
        (0, vitest_1.expect)(err.name).toBe('NotFoundError');
        (0, vitest_1.expect)(err.message).toBe('Player no encontrado');
    });
});
(0, vitest_1.describe)('InfrastructureError', () => {
    (0, vitest_1.it)('crea error con mensaje y cause opcional', () => {
        const cause = new Error('ECONNREFUSED');
        const err = new errors_1.InfrastructureError('Fallo de conexión', cause);
        (0, vitest_1.expect)(err.name).toBe('InfrastructureError');
        (0, vitest_1.expect)(err.message).toBe('Fallo de conexión');
        (0, vitest_1.expect)(err.cause).toBe(cause);
    });
    (0, vitest_1.it)('crea error solo con mensaje cuando no se pasa cause', () => {
        const err = new errors_1.InfrastructureError('BD no disponible');
        (0, vitest_1.expect)(err.name).toBe('InfrastructureError');
        (0, vitest_1.expect)(err.message).toBe('BD no disponible');
        (0, vitest_1.expect)(err.cause).toBeUndefined();
    });
});
