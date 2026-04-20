import type { FastifyInstance } from 'fastify';
import { buildServer } from '../src/main';

let serverPromise: Promise<FastifyInstance> | null = null;

const getServer = async (): Promise<FastifyInstance> => {
  if (!serverPromise) {
    const bootPromise = (async () => {
      const server = await buildServer();
      try {
        await server.ready();
        return server;
      } catch (error) {
        await server.close().catch(() => undefined);
        throw error;
      }
    })();

    serverPromise = bootPromise;

    bootPromise.catch(() => {
      if (serverPromise === bootPromise) {
        serverPromise = null;
      }
    });
  }
  return serverPromise;
};

const handler = async (req: unknown, res: unknown): Promise<void> => {
  const server = await getServer();
  server.server.emit('request', req, res);
};

export default handler;
