"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerRole = void 0;
exports.isPlayerRole = isPlayerRole;
exports.parsePlayerRole = parsePlayerRole;
/**
 * Rol del Player para autorización.
 * USER: usuario normal (registro público).
 * ADMIN: solo un ADMIN puede asignar este rol a otro Player.
 */
var PlayerRole;
(function (PlayerRole) {
    PlayerRole["USER"] = "USER";
    PlayerRole["ADMIN"] = "ADMIN";
})(PlayerRole || (exports.PlayerRole = PlayerRole = {}));
const VALID_ROLES = Object.values(PlayerRole);
function isPlayerRole(value) {
    return VALID_ROLES.includes(value);
}
function parsePlayerRole(value) {
    if (!isPlayerRole(value)) {
        throw new Error(`Rol inválido: ${value}. Debe ser uno de: ${VALID_ROLES.join(', ')}`);
    }
    return value;
}
