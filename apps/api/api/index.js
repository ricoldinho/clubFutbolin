/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
let serverPromise = null;

const getServer = async () => {
  if (!serverPromise) {
    const bootPromise = (async () => {
      const { buildServer } = require('../dist/main.js');
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

module.exports = async (req, res) => {
  const server = await getServer();
  server.server.emit('request', req, res);
};
