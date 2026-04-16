"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRequestScope = void 0;
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
/**
 * Crea un scope de Awilix por request y lo expone en request.container.
 * Asi los registros `scoped` se instancian por peticion HTTP.
 */
const requestScopePlugin = async (server) => {
    server.decorateRequest("container", undefined);
    server.addHook("onRequest", async (request) => {
        request.container = server.container.createScope();
    });
};
exports.registerRequestScope = (0, fastify_plugin_1.default)(requestScopePlugin, {
    name: "request-scope",
    dependencies: [],
});
