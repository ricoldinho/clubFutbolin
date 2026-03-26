/**
 * Error de autenticación: email o contraseña incorrectos en login.
 * No revelar si fue el email o la contraseña (seguridad).
 */
export class InvalidCredentialsError extends Error {
  constructor() {
    super('Credenciales inválidas');
    this.name = 'InvalidCredentialsError';
    Object.setPrototypeOf(this, InvalidCredentialsError.prototype);
  }
}

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
