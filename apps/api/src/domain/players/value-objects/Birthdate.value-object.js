"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Birthdate = void 0;
const errors_1 = require("@/domain/shared/errors");
/**
 * Value Object para fecha de nacimiento.
 * Valida que la fecha sea válida y que no sea futura (Fail Fast).
 */
class Birthdate {
    constructor(value) {
        this._value = value;
    }
    static create(value) {
        const date = typeof value === 'string' ? new Date(value) : value;
        if (Number.isNaN(date.getTime())) {
            throw new errors_1.DomainValidationError(`Fecha inválida: ${value}`);
        }
        const now = new Date();
        if (date > now) {
            throw new errors_1.DomainValidationError('La fecha de nacimiento no puede ser futura');
        }
        return new Birthdate(date);
    }
    get value() {
        return this._value;
    }
    equals(other) {
        return this._value.getTime() === other._value.getTime();
    }
}
exports.Birthdate = Birthdate;
