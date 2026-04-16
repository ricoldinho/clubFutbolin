"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const PlayerCategory_1 = require("@/domain/players/PlayerCategory");
(0, vitest_1.describe)('PlayerCategory', () => {
    (0, vitest_1.it)('debe tener los valores CUARTA, TERCERA, SEGUNDA, PRIMERA, ELITE', () => {
        // Assert
        (0, vitest_1.expect)(PlayerCategory_1.PlayerCategory.CUARTA).toBe('CUARTA');
        (0, vitest_1.expect)(PlayerCategory_1.PlayerCategory.TERCERA).toBe('TERCERA');
        (0, vitest_1.expect)(PlayerCategory_1.PlayerCategory.SEGUNDA).toBe('SEGUNDA');
        (0, vitest_1.expect)(PlayerCategory_1.PlayerCategory.PRIMERA).toBe('PRIMERA');
        (0, vitest_1.expect)(PlayerCategory_1.PlayerCategory.ELITE).toBe('ELITE');
    });
    (0, vitest_1.it)('isPlayerCategory debe devolver true para valores válidos', () => {
        // Act & Assert
        (0, vitest_1.expect)((0, PlayerCategory_1.isPlayerCategory)('ELITE')).toBe(true);
        (0, vitest_1.expect)((0, PlayerCategory_1.isPlayerCategory)('PRIMERA')).toBe(true);
    });
    (0, vitest_1.it)('isPlayerCategory debe devolver false para valores inválidos', () => {
        // Act & Assert
        (0, vitest_1.expect)((0, PlayerCategory_1.isPlayerCategory)('juvenil')).toBe(false);
        (0, vitest_1.expect)((0, PlayerCategory_1.isPlayerCategory)('')).toBe(false);
    });
    (0, vitest_1.it)('parsePlayerCategory debe devolver el enum para string válido', () => {
        // Arrange
        const value = 'CUARTA';
        // Act
        const result = (0, PlayerCategory_1.parsePlayerCategory)(value);
        // Assert
        (0, vitest_1.expect)(result).toBe(PlayerCategory_1.PlayerCategory.CUARTA);
    });
    (0, vitest_1.it)('parsePlayerCategory debe lanzar para string inválido', () => {
        // Arrange
        const value = 'OTRA';
        // Act & Assert
        (0, vitest_1.expect)(() => (0, PlayerCategory_1.parsePlayerCategory)(value)).toThrow(/Categoría inválida/);
    });
});
