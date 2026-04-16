"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const LeagueCategory_1 = require("@/domain/leagues/LeagueCategory");
const errors_1 = require("@/domain/shared/errors");
(0, vitest_1.describe)('LeagueCategory', () => {
    (0, vitest_1.it)('isLeagueCategory devuelve true para valores válidos', () => {
        (0, vitest_1.expect)((0, LeagueCategory_1.isLeagueCategory)('ELITE')).toBe(true);
        (0, vitest_1.expect)((0, LeagueCategory_1.isLeagueCategory)('PRIMERA')).toBe(true);
        (0, vitest_1.expect)((0, LeagueCategory_1.isLeagueCategory)('CUARTA')).toBe(true);
    });
    (0, vitest_1.it)('isLeagueCategory devuelve false para valores inválidos', () => {
        (0, vitest_1.expect)((0, LeagueCategory_1.isLeagueCategory)('INVALID')).toBe(false);
        (0, vitest_1.expect)((0, LeagueCategory_1.isLeagueCategory)('')).toBe(false);
    });
    (0, vitest_1.it)('parseLeagueCategory devuelve el valor para categorías válidas', () => {
        (0, vitest_1.expect)((0, LeagueCategory_1.parseLeagueCategory)('PRO')).toBe('PRO');
        (0, vitest_1.expect)((0, LeagueCategory_1.parseLeagueCategory)('AVANZADO')).toBe('AVANZADO');
    });
    (0, vitest_1.it)('parseLeagueCategory lanza DomainValidationError para valores inválidos', () => {
        (0, vitest_1.expect)(() => (0, LeagueCategory_1.parseLeagueCategory)('XXX')).toThrow(errors_1.DomainValidationError);
        (0, vitest_1.expect)(() => (0, LeagueCategory_1.parseLeagueCategory)('XXX')).toThrow('Categoría de liga inválida');
    });
    (0, vitest_1.it)('LEAGUE_CATEGORIES contiene las 8 categorías', () => {
        (0, vitest_1.expect)(LeagueCategory_1.LEAGUE_CATEGORIES).toContain('ELITE');
        (0, vitest_1.expect)(LeagueCategory_1.LEAGUE_CATEGORIES).toContain('PRO');
        (0, vitest_1.expect)(LeagueCategory_1.LEAGUE_CATEGORIES).toHaveLength(8);
    });
});
