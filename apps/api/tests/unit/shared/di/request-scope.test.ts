import Fastify from 'fastify';
import { createContainer } from 'awilix';
import { describe, it, expect } from 'vitest';
import { registerRequestScope } from '@/shared/di/request-scope';
import type { AppContainerCradle } from '@/shared/di/container';

describe('registerRequestScope', () => {
  it('debe crear un container por request', async () => {
    // Arrange
    const server = Fastify();
    const appContainer = createContainer<AppContainerCradle>();
    const seenContainers: unknown[] = [];

    server.decorate('container', appContainer);
    await server.register(registerRequestScope);
    server.get('/scope', async (request) => {
      seenContainers.push(request.container);
      return { ok: true };
    });

    // Act
    const responseA = await server.inject({ method: 'GET', url: '/scope' });
    const responseB = await server.inject({ method: 'GET', url: '/scope' });

    // Assert
    expect(responseA.statusCode).toBe(200);
    expect(responseB.statusCode).toBe(200);
    expect(seenContainers).toHaveLength(2);
    expect(seenContainers[0]).not.toBe(appContainer);
    expect(seenContainers[1]).not.toBe(appContainer);
    expect(seenContainers[0]).not.toBe(seenContainers[1]);

    await server.close();
  });
});

