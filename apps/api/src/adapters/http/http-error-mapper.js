"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapDomainErrorToHttp = mapDomainErrorToHttp;
const errors_1 = require("@/domain/shared/errors");
const errors_2 = require("@/domain/players/errors");
const errors_3 = require("@/domain/matches/errors");
/**
 * Mapea un error (dominio o inesperado) a código HTTP y mensaje.
 * Añade aquí los nuevos errores de dominio según la taxonomía del proyecto.
 */
function mapDomainErrorToHttp(error) {
    if (error instanceof errors_2.InvalidCredentialsError) {
        return { statusCode: 401, message: error.message };
    }
    if (error instanceof errors_2.EmailAlreadyInUseError) {
        return { statusCode: 409, message: error.message };
    }
    if (error instanceof errors_1.AlreadyExistsError) {
        return { statusCode: 409, message: error.message };
    }
    if (error instanceof errors_1.ForbiddenError) {
        return { statusCode: 403, message: error.message };
    }
    if (error instanceof errors_3.SeasonCalendarAlreadyGeneratedError) {
        return { statusCode: 409, message: error.message };
    }
    if (error instanceof errors_3.InsufficientTeamsForCalendarError) {
        return { statusCode: 400, message: error.message };
    }
    if (error instanceof errors_3.MatchScoreUpdateNotAllowedError ||
        error instanceof errors_3.InvalidMatchScoreError ||
        error instanceof errors_3.MatchTeamsMustBeDifferentError) {
        return { statusCode: 400, message: error.message };
    }
    if (error instanceof errors_1.DomainValidationError) {
        return { statusCode: 400, message: error.message };
    }
    if (error instanceof errors_1.NotFoundError) {
        return { statusCode: 404, message: error.message };
    }
    if (error instanceof errors_1.InfrastructureError) {
        return { statusCode: 500, message: 'Error interno del servidor' };
    }
    return { statusCode: 500, message: 'Error interno del servidor' };
}
