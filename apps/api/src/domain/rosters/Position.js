"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POSITIONS = void 0;
exports.isPosition = isPosition;
exports.parsePosition = parsePosition;
const errors_1 = require("@/domain/shared/errors");
exports.POSITIONS = ['PORTERO', 'DELANTERO'];
const VALID_POSITIONS = new Set(exports.POSITIONS);
function isPosition(value) {
    return VALID_POSITIONS.has(value);
}
function parsePosition(value) {
    if (!isPosition(value)) {
        throw new errors_1.DomainValidationError(`Posición inválida: "${value}". Valores: ${exports.POSITIONS.join(', ')}`);
    }
    return value;
}
