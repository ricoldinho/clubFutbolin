import { describe, it, expect } from 'vitest';
import { JoseJwtService } from '@/adapters/auth/JoseJwtService';

const SECRET = 'test-secret-key';
const EXPIRES_IN = '1h';

describe('JoseJwtService', () => {
  const jwtService = new JoseJwtService(SECRET, EXPIRES_IN);

  it('sign devuelve un token string', async () => {
    const token = await jwtService.sign({
      sub: 'player-uuid-123',
      email: 'a@b.com',
      role: 'USER',
    });
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // JWT tiene 3 partes
  });

  it('verify devuelve payload cuando el token es válido', async () => {
    const token = await jwtService.sign({
      sub: 'player-uuid-456',
      role: 'ADMIN',
    });
    const payload = await jwtService.verify(token);
    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe('player-uuid-456');
    expect(payload!.role).toBe('ADMIN');
  });

  it('verify devuelve null cuando el token es inválido', async () => {
    const payload = await jwtService.verify('invalid.token.here');
    expect(payload).toBeNull();
  });

  it('verify devuelve null cuando el token está malformado', async () => {
    const payload = await jwtService.verify('not-a-jwt');
    expect(payload).toBeNull();
  });

  it('verify devuelve null cuando el token está firmado con otro secret', async () => {
    const otherService = new JoseJwtService('other-secret', EXPIRES_IN);
    const token = await otherService.sign({ sub: 'id', role: 'USER' });
    const payload = await jwtService.verify(token);
    expect(payload).toBeNull();
  });

  it('getExpiresIn devuelve el valor configurado', () => {
    expect(jwtService.getExpiresIn()).toBe(EXPIRES_IN);
  });
});
