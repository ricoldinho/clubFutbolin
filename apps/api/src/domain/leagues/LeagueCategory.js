"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEAGUE_CATEGORIES = void 0;
exports.isLeagueCategory = isLeagueCategory;
exports.parseLeagueCategory = parseLeagueCategory;
const errors_1 = require("@/domain/shared/errors");
/**
 * Categorías de liga permitidas.
 */
exports.LEAGUE_CATEGORIES = [
    'ELITE',
    'PRO',
    'AVANZADO',
    'MASTER',
    'PRIMERA',
    'SEGUNDA',
    'TERCERA',
    'CUARTA',
];
const VALID_CATEGORIES = new Set(exports.LEAGUE_CATEGORIES);
function isLeagueCategory(value) {
    return VALID_CATEGORIES.has(value);
}
function parseLeagueCategory(value) {
    if (!isLeagueCategory(value)) {
        throw new errors_1.DomainValidationError(`Categoría de liga inválida: "${value}". Valores permitidos: ${exports.LEAGUE_CATEGORIES.join(', ')}`);
    }
    return value;
}
