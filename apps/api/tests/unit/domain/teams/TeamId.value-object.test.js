"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TeamId_value_object_1 = require("@/domain/teams/TeamId.value-object");
const errors_1 = require("@/domain/shared/errors");
(0, vitest_1.describe)('TeamId', () => {
    (0, vitest_1.it)('fromString acepta UUID válido', () => {
        const id = TeamId_value_object_1.TeamId.fromString('123e4567-e89b-12d3-a456-426614174000');
        (0, vitest_1.expect)(id.value).toBe('123e4567-e89b-12d3-a456-426614174000');
    });
    (0, vitest_1.it)('fromString lanza DomainValidationError para string vacío', () => {
        (0, vitest_1.expect)(() => TeamId_value_object_1.TeamId.fromString('')).toThrow(errors_1.DomainValidationError);
    });
    (0, vitest_1.it)('fromString lanza DomainValidationError para formato inválido', () => {
        (0, vitest_1.expect)(() => TeamId_value_object_1.TeamId.fromString('not-a-uuid')).toThrow(errors_1.DomainValidationError);
    });
    (0, vitest_1.it)('generate crea un nuevo UUID', () => {
        const id = TeamId_value_object_1.TeamId.generate();
        (0, vitest_1.expect)(id.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
    (0, vitest_1.it)('equals devuelve true para el mismo valor', () => {
        const id1 = TeamId_value_object_1.TeamId.fromString('123e4567-e89b-12d3-a456-426614174000');
        const id2 = TeamId_value_object_1.TeamId.fromString('123e4567-e89b-12d3-a456-426614174000');
        (0, vitest_1.expect)(id1.equals(id2)).toBe(true);
    });
});
