"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const Position_1 = require("@/domain/rosters/Position");
(0, vitest_1.describe)('Position', () => {
    (0, vitest_1.it)('isPosition retorna true para PORTERO y DELANTERO', () => {
        (0, vitest_1.expect)((0, Position_1.isPosition)('PORTERO')).toBe(true);
        (0, vitest_1.expect)((0, Position_1.isPosition)('DELANTERO')).toBe(true);
    });
    (0, vitest_1.it)('isPosition retorna false para valores inválidos', () => {
        (0, vitest_1.expect)((0, Position_1.isPosition)('DEFENSA')).toBe(false);
        (0, vitest_1.expect)((0, Position_1.isPosition)('')).toBe(false);
        (0, vitest_1.expect)((0, Position_1.isPosition)('portero')).toBe(false);
    });
    (0, vitest_1.it)('parsePosition retorna el valor cuando es válido', () => {
        (0, vitest_1.expect)((0, Position_1.parsePosition)('PORTERO')).toBe('PORTERO');
        (0, vitest_1.expect)((0, Position_1.parsePosition)('DELANTERO')).toBe('DELANTERO');
    });
    (0, vitest_1.it)('parsePosition lanza para valores inválidos', () => {
        (0, vitest_1.expect)(() => (0, Position_1.parsePosition)('CENTRO')).toThrow('Posición inválida');
        (0, vitest_1.expect)(() => (0, Position_1.parsePosition)('CENTRO')).toThrow('PORTERO');
        (0, vitest_1.expect)(() => (0, Position_1.parsePosition)('CENTRO')).toThrow('DELANTERO');
    });
    (0, vitest_1.it)('POSITIONS contiene los valores esperados', () => {
        (0, vitest_1.expect)(Position_1.POSITIONS).toEqual(['PORTERO', 'DELANTERO']);
    });
});
