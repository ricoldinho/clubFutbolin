import Fastify from 'fastify';
import { describe, it, expect } from 'vitest';
import { createRequireAuth } from '@/adapters/http/auth/auth-plugin';
import { JoseJwtService } from '@/adapters/auth/JoseJwtService';

const SECRET = 'plugin-test-secret';
const EXPIRES = '1h';

describe('createRequireAuth', () => {
  const jwtService = new JoseJwtService(SECRET, EXPIRES);
  const requireAuth = createRequireAuth(jwtService);

  it('responde 401 cuando no hay header Authorization', async () => {
    const app = Fastify({ logger: false });
    app.addHook('preHandler', requireAuth);
    app.get('/protected', async () => ({ ok: true }));

    const response = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: {},
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      message: 'Token de autenticación requerido',
    });
  });

  it('responde 401 cuando Authorization no empieza por Bearer ', async () => {
    const app = Fastify({ logger: false });
    app.addHook('preHandler', requireAuth);
    app.get('/protected', async () => ({ ok: true }));

    const response = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: 'Basic xyz' },
    });

    expect(response.statusCode).toBe(401);
  });

  it('responde 401 cuando el token es inválido', async () => {
    const app = Fastify({ logger: false });
    app.addHook('preHandler', requireAuth);
    app.get('/protected', async () => ({ ok: true }));

    const response = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: 'Bearer invalid.token.here' },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      message: 'Token inválido o caducado',
    });
  });

  it('adjunta request.user y deja pasar cuando el token es válido', async () => {
    const token = await jwtService.sign({
      sub: 'player-uuid-123',
      role: 'USER',
    });

    const app = Fastify({ logger: false });
    app.addHook('preHandler', requireAuth);
    app.get('/protected', async (request) => {
      return { playerId: request.user!.playerId, role: request.user!.role };
    });

    const response = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ playerId: 'player-uuid-123', role: 'USER' });
  });
});
