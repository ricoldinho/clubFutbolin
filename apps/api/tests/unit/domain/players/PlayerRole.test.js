"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const PlayerRole_1 = require("@/domain/players/PlayerRole");
(0, vitest_1.describe)('PlayerRole', () => {
    (0, vitest_1.it)('tiene los valores USER y ADMIN', () => {
        (0, vitest_1.expect)(PlayerRole_1.PlayerRole.USER).toBe('USER');
        (0, vitest_1.expect)(PlayerRole_1.PlayerRole.ADMIN).toBe('ADMIN');
    });
    (0, vitest_1.it)('isPlayerRole devuelve true para USER y ADMIN', () => {
        (0, vitest_1.expect)((0, PlayerRole_1.isPlayerRole)('USER')).toBe(true);
        (0, vitest_1.expect)((0, PlayerRole_1.isPlayerRole)('ADMIN')).toBe(true);
    });
    (0, vitest_1.it)('isPlayerRole devuelve false para valores inválidos', () => {
        (0, vitest_1.expect)((0, PlayerRole_1.isPlayerRole)('GUEST')).toBe(false);
        (0, vitest_1.expect)((0, PlayerRole_1.isPlayerRole)('')).toBe(false);
        (0, vitest_1.expect)((0, PlayerRole_1.isPlayerRole)('user')).toBe(false);
    });
    (0, vitest_1.it)('parsePlayerRole devuelve el enum para string válido', () => {
        (0, vitest_1.expect)((0, PlayerRole_1.parsePlayerRole)('USER')).toBe(PlayerRole_1.PlayerRole.USER);
        (0, vitest_1.expect)((0, PlayerRole_1.parsePlayerRole)('ADMIN')).toBe(PlayerRole_1.PlayerRole.ADMIN);
    });
    (0, vitest_1.it)('parsePlayerRole lanza para string inválido', () => {
        (0, vitest_1.expect)(() => (0, PlayerRole_1.parsePlayerRole)('INVALID')).toThrow(/Rol inválido/);
        (0, vitest_1.expect)(() => (0, PlayerRole_1.parsePlayerRole)('')).toThrow(/Rol inválido/);
    });
});
