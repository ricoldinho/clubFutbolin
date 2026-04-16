"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailAlreadyInUseError = exports.InvalidCredentialsError = void 0;
/**
 * Error de autenticación: email o contraseña incorrectos en login.
 * No revelar si fue el email o la contraseña (seguridad).
 */
class InvalidCredentialsError extends Error {
    constructor() {
        super('Credenciales inválidas');
        this.name = 'InvalidCredentialsError';
        Object.setPrototypeOf(this, InvalidCredentialsError.prototype);
    }
}
exports.InvalidCredentialsError = InvalidCredentialsError;
/**
 * Error de dominio: el email ya está asociado a otro Player.
 */
class EmailAlreadyInUseError extends Error {
    constructor(email) {
        super(`El email ${email} ya está registrado`);
        this.email = email;
        this.name = 'EmailAlreadyInUseError';
        Object.setPrototypeOf(this, EmailAlreadyInUseError.prototype);
    }
}
exports.EmailAlreadyInUseError = EmailAlreadyInUseError;
