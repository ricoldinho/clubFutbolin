"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchId = void 0;
const uuid_1 = require("uuid");
const errors_1 = require("@/domain/shared/errors");
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
class MatchId {
    constructor(value) {
        this._value = value.toLowerCase();
    }
    static fromString(value) {
        const trimmed = value.trim();
        if (!trimmed) {
            throw new errors_1.DomainValidationError('MatchId no puede estar vacío');
        }
        if (!UUID_REGEX.test(trimmed)) {
            throw new errors_1.DomainValidationError(`Formato de MatchId inválido (se espera UUID): ${value}`);
        }
        return new MatchId(trimmed);
    }
    static generate() {
        return new MatchId((0, uuid_1.v7)());
    }
    get value() {
        return this._value;
    }
    equals(other) {
        return this._value === other._value;
    }
}
exports.MatchId = MatchId;
