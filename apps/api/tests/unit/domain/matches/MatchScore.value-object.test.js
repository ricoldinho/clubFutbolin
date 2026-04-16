"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const MatchScore_value_object_1 = require("@/domain/matches/MatchScore.value-object");
const errors_1 = require("@/domain/matches/errors");
(0, vitest_1.describe)('MatchScore', () => {
    (0, vitest_1.it)('crea marcador pendiente con ambos valores en null', () => {
        // Arrange
        // Sin datos de marcador.
        // Act
        const score = MatchScore_value_object_1.MatchScore.pending();
        // Assert
        (0, vitest_1.expect)(score.home).toBeNull();
        (0, vitest_1.expect)(score.away).toBeNull();
        (0, vitest_1.expect)(score.hasResult()).toBe(false);
    });
    (0, vitest_1.it)('lanza error si solo uno de los valores es null', () => {
        // Arrange
        const homeScore = 1;
        const awayScore = null;
        // Act + Assert
        (0, vitest_1.expect)(() => MatchScore_value_object_1.MatchScore.fromNullable(homeScore, awayScore)).toThrow(errors_1.InvalidMatchScoreError);
    });
    (0, vitest_1.it)('lanza error si el marcador es negativo', () => {
        // Arrange
        const homeScore = -1;
        const awayScore = 2;
        // Act + Assert
        (0, vitest_1.expect)(() => MatchScore_value_object_1.MatchScore.fromResult(homeScore, awayScore)).toThrow(errors_1.InvalidMatchScoreError);
    });
});
