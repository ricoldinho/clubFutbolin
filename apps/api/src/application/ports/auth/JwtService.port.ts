export type JwtTokenType = 'access' | 'refresh';

/**
 * Payload que se incluye en el JWT (claims).
 */
export interface JwtPayload {
  sub: string; // playerId (UUID)
  email?: string;
  role: string;
  tokenType?: JwtTokenType;
  jti?: string;
  tokenFamily?: string;
}

/**
 * Resultado de verificar un token.
 */
export interface JwtVerifyResult {
  sub: string;
  role: string;
  tokenType: JwtTokenType;
  jti: string | null;
  tokenFamily: string | null;
}

export interface JwtSignOptions {
  expiresIn?: string;
}

/**
 * Puerto para emitir y verificar JWTs.
 * La implementación (jose, jsonwebtoken) vive en adapters.
 */
export interface IJwtService {
  sign(payload: JwtPayload, options?: JwtSignOptions): Promise<string>;
  verify(token: string, expectedTokenType?: JwtTokenType): Promise<JwtVerifyResult | null>;
  /** Ej. "7d" para incluir en la respuesta de login. */
  getExpiresIn(): string;
}
