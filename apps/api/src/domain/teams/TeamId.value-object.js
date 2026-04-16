"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamId = void 0;
const uuid_1 = require("uuid");
const errors_1 = require("@/domain/shared/errors");
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
class TeamId {
    constructor(value) {
        this._value = value.toLowerCase();
    }
    static fromString(value) {
        const trimmed = value.trim();
        if (!trimmed) {
            throw new errors_1.DomainValidationError('TeamId no puede estar vacío');
        }
        if (!UUID_REGEX.test(trimmed)) {
            throw new errors_1.DomainValidationError(`Formato de TeamId inválido (se espera UUID): ${value}`);
        }
        return new TeamId(trimmed);
    }
    static generate() {
        return new TeamId((0, uuid_1.v7)());
    }
    get value() {
        return this._value;
    }
    equals(other) {
        return this._value === other._value;
    }
}
exports.TeamId = TeamId;
