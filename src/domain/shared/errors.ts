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

