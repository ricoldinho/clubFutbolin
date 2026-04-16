"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const LeagueId_value_object_1 = require("@/domain/leagues/LeagueId.value-object");
const errors_1 = require("@/domain/shared/errors");
(0, vitest_1.describe)('LeagueId', () => {
    (0, vitest_1.it)('fromString acepta UUID válido', () => {
        const id = LeagueId_value_object_1.LeagueId.fromString('123e4567-e89b-12d3-a456-426614174000');
        (0, vitest_1.expect)(id.value).toBe('123e4567-e89b-12d3-a456-426614174000');
    });
    (0, vitest_1.it)('fromString lanza DomainValidationError para string vacío', () => {
        (0, vitest_1.expect)(() => LeagueId_value_object_1.LeagueId.fromString('')).toThrow(errors_1.DomainValidationError);
    });
    (0, vitest_1.it)('generate crea un nuevo UUID', () => {
        const id = LeagueId_value_object_1.LeagueId.generate();
        (0, vitest_1.expect)(id.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
});
