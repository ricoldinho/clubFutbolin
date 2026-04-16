"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerCategory = void 0;
exports.isPlayerCategory = isPlayerCategory;
exports.parsePlayerCategory = parsePlayerCategory;
const errors_1 = require("@/domain/shared/errors");
/**
 * Categoría de liga del jugador.
 */
var PlayerCategory;
(function (PlayerCategory) {
    PlayerCategory["CUARTA"] = "CUARTA";
    PlayerCategory["TERCERA"] = "TERCERA";
    PlayerCategory["SEGUNDA"] = "SEGUNDA";
    PlayerCategory["PRIMERA"] = "PRIMERA";
    PlayerCategory["ELITE"] = "ELITE";
})(PlayerCategory || (exports.PlayerCategory = PlayerCategory = {}));
const VALID_CATEGORIES = new Set(Object.values(PlayerCategory));
function isPlayerCategory(value) {
    return VALID_CATEGORIES.has(value);
}
function parsePlayerCategory(value) {
    if (!isPlayerCategory(value)) {
        throw new errors_1.DomainValidationError(`Categoría inválida: "${value}". Valores permitidos: ${Array.from(VALID_CATEGORIES).join(', ')}`);
    }
    return value;
}
