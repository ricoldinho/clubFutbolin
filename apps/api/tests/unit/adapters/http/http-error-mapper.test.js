"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const http_error_mapper_1 = require("@/adapters/http/http-error-mapper");
const errors_1 = require("@/domain/shared/errors");
const errors_2 = require("@/domain/players/errors");
(0, vitest_1.describe)('mapDomainErrorToHttp', () => {
    (0, vitest_1.it)('mapea InvalidCredentialsError a 401 y mensaje del error', () => {
        const err = new errors_2.InvalidCredentialsError();
        const result = (0, http_error_mapper_1.mapDomainErrorToHttp)(err);
        (0, vitest_1.expect)(result.statusCode).toBe(401);
        (0, vitest_1.expect)(result.message).toBe('Credenciales inválidas');
    });
    (0, vitest_1.it)('mapea AlreadyExistsError a 409 y mensaje del error', () => {
        const err = new errors_1.AlreadyExistsError('Team', 'nombre "Equipo A"');
        const result = (0, http_error_mapper_1.mapDomainErrorToHttp)(err);
        (0, vitest_1.expect)(result.statusCode).toBe(409);
        (0, vitest_1.expect)(result.message).toContain('Equipo A');
    });
    (0, vitest_1.it)('mapea EmailAlreadyInUseError a 409 y mensaje del error', () => {
        const err = new errors_2.EmailAlreadyInUseError('a@b.com');
        const result = (0, http_error_mapper_1.mapDomainErrorToHttp)(err);
        (0, vitest_1.expect)(result.statusCode).toBe(409);
        (0, vitest_1.expect)(result.message).toContain('a@b.com');
    });
    (0, vitest_1.it)('mapea DomainValidationError a 400 y mensaje del error', () => {
        const err = new errors_1.DomainValidationError('Datos inválidos');
        const result = (0, http_error_mapper_1.mapDomainErrorToHttp)(err);
        (0, vitest_1.expect)(result.statusCode).toBe(400);
        (0, vitest_1.expect)(result.message).toBe('Datos inválidos');
    });
    (0, vitest_1.it)('mapea ForbiddenError a 403 y mensaje del error', () => {
        const err = new errors_1.ForbiddenError();
        const result = (0, http_error_mapper_1.mapDomainErrorToHttp)(err);
        (0, vitest_1.expect)(result.statusCode).toBe(403);
        (0, vitest_1.expect)(result.message).toContain('permiso');
    });
    (0, vitest_1.it)('mapea NotFoundError a 404 y mensaje del error', () => {
        const err = new errors_1.NotFoundError('Player', 'id-123');
        const result = (0, http_error_mapper_1.mapDomainErrorToHttp)(err);
        (0, vitest_1.expect)(result.statusCode).toBe(404);
        (0, vitest_1.expect)(result.message).toContain('Player');
        (0, vitest_1.expect)(result.message).toContain('id-123');
    });
    (0, vitest_1.it)('mapea InfrastructureError a 500 y mensaje genérico', () => {
        const err = new errors_1.InfrastructureError('BD caída');
        const result = (0, http_error_mapper_1.mapDomainErrorToHttp)(err);
        (0, vitest_1.expect)(result.statusCode).toBe(500);
        (0, vitest_1.expect)(result.message).toBe('Error interno del servidor');
    });
    (0, vitest_1.it)('mapea error desconocido a 500 y mensaje genérico', () => {
        const result = (0, http_error_mapper_1.mapDomainErrorToHttp)(new Error('Cualquier error'));
        (0, vitest_1.expect)(result.statusCode).toBe(500);
        (0, vitest_1.expect)(result.message).toBe('Error interno del servidor');
    });
});
