"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerId = void 0;
const uuid_1 = require("uuid");
const errors_1 = require("@/domain/shared/errors");
/**
 * Identificador único del Player. UUID (recomendado v7) compatible con PostgreSQL uuid.
 * - v7: ordenado en el tiempo, mejor para índices B-tree.
 * - Se genera en aplicación para poder crear la entidad antes de persistir.
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
class PlayerId {
    constructor(value) {
        this._value = value.toLowerCase();
    }
    static fromString(value) {
        const trimmed = value.trim();
        if (!trimmed) {
            throw new errors_1.DomainValidationError('PlayerId no puede estar vacío');
        }
        if (!UUID_REGEX.test(trimmed)) {
            throw new errors_1.DomainValidationError(`Formato de PlayerId inválido (se espera UUID): ${value}`);
        }
        return new PlayerId(trimmed);
    }
    static generate() {
        return new PlayerId((0, uuid_1.v7)());
    }
    get value() {
        return this._value;
    }
    equals(other) {
        return this._value === other._value;
    }
}
exports.PlayerId = PlayerId;
