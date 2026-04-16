"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Email = void 0;
const errors_1 = require("@/domain/shared/errors");
/**
 * Value Object para email. Valida formato en creación (Fail Fast).
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
class Email {
    constructor(value) {
        this._value = value.trim().toLowerCase();
    }
    static create(value) {
        const trimmed = value.trim();
        if (!trimmed) {
            throw new errors_1.DomainValidationError('Email no puede estar vacío');
        }
        if (!EMAIL_REGEX.test(trimmed)) {
            throw new errors_1.DomainValidationError(`Formato de email inválido: ${value}`);
        }
        return new Email(trimmed);
    }
    get value() {
        return this._value;
    }
    equals(other) {
        return this._value === other._value;
    }
}
exports.Email = Email;
