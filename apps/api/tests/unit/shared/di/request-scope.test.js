"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const awilix_1 = require("awilix");
const vitest_1 = require("vitest");
const request_scope_1 = require("@/shared/di/request-scope");
(0, vitest_1.describe)('registerRequestScope', () => {
    (0, vitest_1.it)('debe crear un container por request', async () => {
        // Arrange
        const server = (0, fastify_1.default)();
        const appContainer = (0, awilix_1.createContainer)();
        const seenContainers = [];
        server.decorate('container', appContainer);
        await server.register(request_scope_1.registerRequestScope);
        server.get('/scope', async (request) => {
            seenContainers.push(request.container);
            return { ok: true };
        });
        // Act
        const responseA = await server.inject({ method: 'GET', url: '/scope' });
        const responseB = await server.inject({ method: 'GET', url: '/scope' });
        // Assert
        (0, vitest_1.expect)(responseA.statusCode).toBe(200);
        (0, vitest_1.expect)(responseB.statusCode).toBe(200);
        (0, vitest_1.expect)(seenContainers).toHaveLength(2);
        (0, vitest_1.expect)(seenContainers[0]).not.toBe(appContainer);
        (0, vitest_1.expect)(seenContainers[1]).not.toBe(appContainer);
        (0, vitest_1.expect)(seenContainers[0]).not.toBe(seenContainers[1]);
        await server.close();
    });
});
