/**
 * Payload que se incluye en el JWT (claims).
 */
export interface JwtPayload {
  sub: string; // playerId (UUID)
  email?: string;
  role: string;
}

/**
 * Resultado de verificar un token.
 */
export interface JwtVerifyResult {
  sub: string;
  role: string;
}

/**
 * Puerto para emitir y verificar JWTs.
 * La implementación (jose, jsonwebtoken) vive en adapters.
 */
export interface IJwtService {
  sign(payload: JwtPayload): Promise<string>;
  verify(token: string): Promise<JwtVerifyResult | null>;
  /** Ej. "7d" para incluir en la respuesta de login. */
  getExpiresIn(): string;
}
