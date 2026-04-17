import * as jose from 'jose';
import { randomUUID } from 'node:crypto';
import type {
  IJwtService,
  JwtPayload,
  JwtSignOptions,
  JwtTokenType,
  JwtVerifyResult,
} from '@/application/ports/auth/JwtService.port';

export class JoseJwtService implements IJwtService {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string,
  ) {}

  async sign(payload: JwtPayload, options?: JwtSignOptions): Promise<string> {
    const secret = new TextEncoder().encode(this.secret);
    return new jose.SignJWT({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      tokenType: payload.tokenType ?? 'access',
      tokenFamily: payload.tokenFamily,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(payload.sub)
      .setJti(payload.jti ?? randomUUID())
      .setExpirationTime(options?.expiresIn ?? this.expiresIn)
      .sign(secret);
  }

  async verify(token: string, expectedTokenType?: JwtTokenType): Promise<JwtVerifyResult | null> {
    try {
      const secret = new TextEncoder().encode(this.secret);
      const { payload } = await jose.jwtVerify(token, secret);
      const sub = payload.sub ?? payload['sub'];
      const role = payload.role ?? payload['role'];
      const tokenType = payload.tokenType ?? payload['tokenType'] ?? 'access';
      const tokenFamily = payload.tokenFamily ?? payload['tokenFamily'] ?? null;
      if (typeof sub !== 'string' || typeof role !== 'string') return null;
      if (tokenType !== 'access' && tokenType !== 'refresh') return null;
      if (expectedTokenType !== undefined && expectedTokenType !== tokenType) return null;
      return {
        sub,
        role,
        tokenType,
        jti: typeof payload.jti === 'string' ? payload.jti : null,
        tokenFamily: typeof tokenFamily === 'string' ? tokenFamily : null,
      };
    } catch {
      return null;
    }
  }

  getExpiresIn(): string {
    return this.expiresIn;
  }
}
