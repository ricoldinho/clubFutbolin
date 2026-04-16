"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const SeasonId_value_object_1 = require("@/domain/seasons/SeasonId.value-object");
(0, vitest_1.describe)('SeasonId', () => {
    (0, vitest_1.it)('fromString acepta UUID válido', () => {
        const id = SeasonId_value_object_1.SeasonId.fromString('123e4567-e89b-12d3-a456-426614174000');
        (0, vitest_1.expect)(id.value).toBe('123e4567-e89b-12d3-a456-426614174000');
    });
    (0, vitest_1.it)('fromString lanza para string vacío', () => {
        (0, vitest_1.expect)(() => SeasonId_value_object_1.SeasonId.fromString('')).toThrow('vacío');
        (0, vitest_1.expect)(() => SeasonId_value_object_1.SeasonId.fromString('   ')).toThrow('vacío');
    });
    (0, vitest_1.it)('fromString lanza para formato no UUID', () => {
        (0, vitest_1.expect)(() => SeasonId_value_object_1.SeasonId.fromString('no-es-uuid')).toThrow('inválido');
    });
    (0, vitest_1.it)('generate crea id único', () => {
        const id = SeasonId_value_object_1.SeasonId.generate();
        (0, vitest_1.expect)(id.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
    (0, vitest_1.it)('equals compara por valor', () => {
        const a = SeasonId_value_object_1.SeasonId.fromString('123e4567-e89b-12d3-a456-426614174000');
        const b = SeasonId_value_object_1.SeasonId.fromString('123e4567-e89b-12d3-a456-426614174000');
        const c = SeasonId_value_object_1.SeasonId.fromString('123e4567-e89b-12d3-a456-426614174001');
        (0, vitest_1.expect)(a.equals(b)).toBe(true);
        (0, vitest_1.expect)(a.equals(c)).toBe(false);
    });
});
