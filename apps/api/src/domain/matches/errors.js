"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeasonCalendarAlreadyGeneratedError = exports.InsufficientTeamsForCalendarError = exports.MatchScoreUpdateNotAllowedError = exports.InvalidMatchScoreError = exports.MatchTeamsMustBeDifferentError = void 0;
class MatchTeamsMustBeDifferentError extends Error {
    constructor() {
        super('El equipo local y visitante deben ser diferentes');
        this.name = 'MatchTeamsMustBeDifferentError';
        Object.setPrototypeOf(this, MatchTeamsMustBeDifferentError.prototype);
    }
}
exports.MatchTeamsMustBeDifferentError = MatchTeamsMustBeDifferentError;
class InvalidMatchScoreError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidMatchScoreError';
        Object.setPrototypeOf(this, InvalidMatchScoreError.prototype);
    }
}
exports.InvalidMatchScoreError = InvalidMatchScoreError;
class MatchScoreUpdateNotAllowedError extends Error {
    constructor() {
        super('No se puede actualizar el marcador de un partido cancelado');
        this.name = 'MatchScoreUpdateNotAllowedError';
        Object.setPrototypeOf(this, MatchScoreUpdateNotAllowedError.prototype);
    }
}
exports.MatchScoreUpdateNotAllowedError = MatchScoreUpdateNotAllowedError;
class InsufficientTeamsForCalendarError extends Error {
    constructor() {
        super('No hay suficientes equipos inscritos para generar calendario');
        this.name = 'InsufficientTeamsForCalendarError';
        Object.setPrototypeOf(this, InsufficientTeamsForCalendarError.prototype);
    }
}
exports.InsufficientTeamsForCalendarError = InsufficientTeamsForCalendarError;
class SeasonCalendarAlreadyGeneratedError extends Error {
    constructor() {
        super('La temporada ya tiene partidos generados');
        this.name = 'SeasonCalendarAlreadyGeneratedError';
        Object.setPrototypeOf(this, SeasonCalendarAlreadyGeneratedError.prototype);
    }
}
exports.SeasonCalendarAlreadyGeneratedError = SeasonCalendarAlreadyGeneratedError;
