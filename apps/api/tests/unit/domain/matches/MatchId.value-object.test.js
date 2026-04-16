"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const MatchId_value_object_1 = require("@/domain/matches/MatchId.value-object");
const errors_1 = require("@/domain/shared/errors");
(0, vitest_1.describe)('MatchId', () => {
    (0, vitest_1.it)('genera un UUID válido', () => {
        // Arrange
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        // Act
        const matchId = MatchId_value_object_1.MatchId.generate();
        // Assert
        (0, vitest_1.expect)(uuidRegex.test(matchId.value)).toBe(true);
    });
    (0, vitest_1.it)('lanza error cuando el valor está vacío', () => {
        // Arrange
        const rawMatchId = '   ';
        // Act + Assert
        (0, vitest_1.expect)(() => MatchId_value_object_1.MatchId.fromString(rawMatchId)).toThrow(errors_1.DomainValidationError);
    });
});
