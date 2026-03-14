/**
 * Error genérico de validación de dominio.
 * Se usa en Value Objects y parseos de dominio cuando los datos
 * no cumplen las reglas de negocio, pero el fallo no es de infraestructura.
 */
export class DomainValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainValidationError';
    Object.setPrototypeOf(this, DomainValidationError.prototype);
  }
}

/**
 * Error genérico de "no encontrado" en el dominio.
 * Úsalo cuando un agregado/entidad no existe para un criterio dado.
 */
export class NotFoundError extends Error {
  constructor(entity: string, criteria?: string) {
    super(
      criteria
        ? `${entity} no encontrado: ${criteria}`
        : `${entity} no encontrado`,
    );
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Error de autorización: el actor no tiene permiso para esta acción.
 * Ej.: un USER intenta asignar role ADMIN a otro Player.
 */
export class ForbiddenError extends Error {
  constructor(message = 'No tienes permiso para realizar esta acción') {
    super(message);
    this.name = 'ForbiddenError';
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * Error de infraestructura: fallos de BD, red, etc.
 * Úsalo en repositorios y adaptadores cuando algo externo falla.
 */
export class InfrastructureError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'InfrastructureError';
    Object.setPrototypeOf(this, InfrastructureError.prototype);
  }
}
