"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfrastructureError = exports.ForbiddenError = exports.NotFoundError = exports.AlreadyExistsError = exports.DomainValidationError = void 0;
/**
 * Error genérico de validación de dominio.
 * Se usa en Value Objects y parseos de dominio cuando los datos
 * no cumplen las reglas de negocio, pero el fallo no es de infraestructura.
 */
class DomainValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'DomainValidationError';
        Object.setPrototypeOf(this, DomainValidationError.prototype);
    }
}
exports.DomainValidationError = DomainValidationError;
/**
 * Error cuando ya existe una entidad con el criterio dado (ej. nombre duplicado).
 */
class AlreadyExistsError extends Error {
    constructor(entity, criteria) {
        super(`${entity} ya existe: ${criteria}`);
        this.name = 'AlreadyExistsError';
        Object.setPrototypeOf(this, AlreadyExistsError.prototype);
    }
}
exports.AlreadyExistsError = AlreadyExistsError;
/**
 * Error genérico de "no encontrado" en el dominio.
 * Úsalo cuando un agregado/entidad no existe para un criterio dado.
 */
class NotFoundError extends Error {
    constructor(entity, criteria) {
        super(criteria
            ? `${entity} no encontrado: ${criteria}`
            : `${entity} no encontrado`);
        this.name = 'NotFoundError';
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Error de autorización: el actor no tiene permiso para esta acción.
 * Ej.: un USER intenta asignar role ADMIN a otro Player.
 */
class ForbiddenError extends Error {
    constructor(message = 'No tienes permiso para realizar esta acción') {
        super(message);
        this.name = 'ForbiddenError';
        Object.setPrototypeOf(this, ForbiddenError.prototype);
    }
}
exports.ForbiddenError = ForbiddenError;
/**
 * Error de infraestructura: fallos de BD, red, etc.
 * Úsalo en repositorios y adaptadores cuando algo externo falla.
 */
class InfrastructureError extends Error {
    constructor(message, cause) {
        super(message);
        this.cause = cause;
        this.name = 'InfrastructureError';
        Object.setPrototypeOf(this, InfrastructureError.prototype);
    }
}
exports.InfrastructureError = InfrastructureError;
