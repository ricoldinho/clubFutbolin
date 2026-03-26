/**
 * Puerto para hashear y verificar contraseñas.
 * La implementación (bcrypt, argon2) vive en adapters.
 */
export interface IPasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, hash: string): Promise<boolean>;
}
