import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import type { AwilixContainer } from "awilix";
import type { AppContainerCradle } from "./container";

/**
 * Crea un scope de Awilix por request y lo expone en request.container.
 * Asi los registros `scoped` se instancian por peticion HTTP.
 */
const requestScopePlugin: FastifyPluginAsync = async (server) => {
  server.decorateRequest(
    "container",
    undefined as unknown as AwilixContainer<AppContainerCradle>,
  );

  server.addHook("onRequest", async (request) => {
    request.container = server.container.createScope();
  });
};

export const registerRequestScope = fp(requestScopePlugin, {
  name: "request-scope",
  dependencies: [],
});
