/**
 * Error de dominio: el email ya está asociado a otro Player.
 */
export class EmailAlreadyInUseError extends Error {
  constructor(public readonly email: string) {
    super(`El email ${email} ya está registrado`);
    this.name = 'EmailAlreadyInUseError';
    Object.setPrototypeOf(this, EmailAlreadyInUseError.prototype);
  }
}
