"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhoneNumber = void 0;
const errors_1 = require("@/domain/shared/errors");
/**
 * Value Object para número de teléfono. Acepta dígitos, opcionalmente + al inicio.
 * Longitud típica: 9–15 dígitos (E.164 permite hasta 15).
 */
const MIN_DIGITS = 9;
const MAX_DIGITS = 15;
function extractDigits(value) {
    return value.replace(/\D/g, '');
}
class PhoneNumber {
    constructor(value) {
        this._value = value;
    }
    static create(value) {
        const digits = extractDigits(value);
        if (digits.length < MIN_DIGITS) {
            throw new errors_1.DomainValidationError(`Número de teléfono inválido: debe tener al menos ${MIN_DIGITS} dígitos (recibidos: ${digits.length})`);
        }
        if (digits.length > MAX_DIGITS) {
            throw new errors_1.DomainValidationError(`Número de teléfono inválido: máximo ${MAX_DIGITS} dígitos (recibidos: ${digits.length})`);
        }
        return new PhoneNumber(digits);
    }
    get value() {
        return this._value;
    }
    equals(other) {
        return this._value === other._value;
    }
}
exports.PhoneNumber = PhoneNumber;
