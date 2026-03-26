import * as jose from 'jose';
import type {
  IJwtService,
  JwtPayload,
  JwtVerifyResult,
} from '@/application/ports/auth/JwtService.port';

export class JoseJwtService implements IJwtService {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string,
  ) {}

  async sign(payload: JwtPayload): Promise<string> {
    const secret = new TextEncoder().encode(this.secret);
    return new jose.SignJWT({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(payload.sub)
      .setExpirationTime(this.expiresIn)
      .sign(secret);
  }

  async verify(token: string): Promise<JwtVerifyResult | null> {
    try {
      const secret = new TextEncoder().encode(this.secret);
      const { payload } = await jose.jwtVerify(token, secret);
      const sub = payload.sub ?? payload['sub'];
      const role = payload.role ?? payload['role'];
      if (typeof sub !== 'string' || typeof role !== 'string') return null;
      return { sub, role };
    } catch {
      return null;
    }
  }

  getExpiresIn(): string {
    return this.expiresIn;
  }
}
