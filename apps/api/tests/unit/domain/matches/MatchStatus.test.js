"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const MatchStatus_1 = require("@/domain/matches/MatchStatus");
(0, vitest_1.describe)('MatchStatus', () => {
    (0, vitest_1.it)('expone los estados válidos del partido', () => {
        // Arrange
        // Estados esperados.
        // Act + Assert
        (0, vitest_1.expect)(MatchStatus_1.MatchStatus.SCHEDULED).toBe('SCHEDULED');
        (0, vitest_1.expect)(MatchStatus_1.MatchStatus.FINISHED).toBe('FINISHED');
        (0, vitest_1.expect)(MatchStatus_1.MatchStatus.POSTPONED).toBe('POSTPONED');
        (0, vitest_1.expect)(MatchStatus_1.MatchStatus.CANCELLED).toBe('CANCELLED');
    });
    (0, vitest_1.it)('isMatchStatus devuelve true para un estado válido', () => {
        // Arrange
        const status = 'FINISHED';
        // Act
        const isValid = (0, MatchStatus_1.isMatchStatus)(status);
        // Assert
        (0, vitest_1.expect)(isValid).toBe(true);
    });
    (0, vitest_1.it)('parseMatchStatus lanza error para estado inválido', () => {
        // Arrange
        const invalidStatus = 'PLAYING';
        // Act + Assert
        (0, vitest_1.expect)(() => (0, MatchStatus_1.parseMatchStatus)(invalidStatus)).toThrow(/Estado de partido inválido/);
    });
});
