import Fastify from 'fastify';
import {
  ZodTypeProvider,
  validatorCompiler,
  serializerCompiler,
} from 'fastify-type-provider-zod';
import { z } from 'zod';
import { describe, it, expect, afterEach } from 'vitest';
import { registerOpenApi } from '@/adapters/http/register-openapi';

describe('registerOpenApi', () => {
  let app: ReturnType<typeof Fastify>;

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('expone JSON OpenAPI en /documentation/json e incluye rutas con schema Zod', async () => {
    app = Fastify({ logger: false }).withTypeProvider<ZodTypeProvider>();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    await registerOpenApi(app);

    app.get(
      '/__openapi_probe__',
      {
        schema: {
          response: { 200: z.object({ ok: z.boolean() }) },
          tags: ['health'],
          summary: 'Sonda interna de test',
        },
      },
      async () => ({ ok: true }),
    );

    await app.ready();

    const res = await app.inject({ method: 'GET', url: '/documentation/json' });
    expect(res.statusCode).toBe(200);
    const doc = JSON.parse(res.payload) as {
      openapi: string;
      paths: Record<string, unknown>;
      components?: { securitySchemes?: { bearerAuth?: { type: string } } };
    };
    expect(doc.openapi).toMatch(/^3\.0\./);
    expect(doc.paths['/__openapi_probe__']).toBeDefined();
    expect(doc.components?.securitySchemes?.bearerAuth?.type).toBe('http');
  });
});
