"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeasonId = void 0;
const uuid_1 = require("uuid");
const errors_1 = require("@/domain/shared/errors");
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
class SeasonId {
    constructor(value) {
        this._value = value.toLowerCase();
    }
    static fromString(value) {
        const trimmed = value.trim();
        if (!trimmed) {
            throw new errors_1.DomainValidationError('SeasonId no puede estar vacío');
        }
        if (!UUID_REGEX.test(trimmed)) {
            throw new errors_1.DomainValidationError(`Formato de SeasonId inválido (se espera UUID): ${value}`);
        }
        return new SeasonId(trimmed);
    }
    static generate() {
        return new SeasonId((0, uuid_1.v7)());
    }
    get value() {
        return this._value;
    }
    equals(other) {
        return this._value === other._value;
    }
}
exports.SeasonId = SeasonId;
