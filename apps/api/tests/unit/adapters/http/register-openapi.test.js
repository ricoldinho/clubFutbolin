"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const fastify_type_provider_zod_1 = require("fastify-type-provider-zod");
const zod_1 = require("zod");
const vitest_1 = require("vitest");
const register_openapi_1 = require("@/adapters/http/register-openapi");
(0, vitest_1.describe)('registerOpenApi', () => {
    let app;
    (0, vitest_1.afterEach)(async () => {
        if (app) {
            await app.close();
        }
    });
    (0, vitest_1.it)('expone JSON OpenAPI en /documentation/json e incluye rutas con schema Zod', async () => {
        app = (0, fastify_1.default)({ logger: false }).withTypeProvider();
        app.setValidatorCompiler(fastify_type_provider_zod_1.validatorCompiler);
        app.setSerializerCompiler(fastify_type_provider_zod_1.serializerCompiler);
        await (0, register_openapi_1.registerOpenApi)(app);
        app.get('/__openapi_probe__', {
            schema: {
                response: { 200: zod_1.z.object({ ok: zod_1.z.boolean() }) },
                tags: ['health'],
                summary: 'Sonda interna de test',
            },
        }, async () => ({ ok: true }));
        await app.ready();
        const res = await app.inject({ method: 'GET', url: '/documentation/json' });
        (0, vitest_1.expect)(res.statusCode).toBe(200);
        const doc = JSON.parse(res.payload);
        (0, vitest_1.expect)(doc.openapi).toMatch(/^3\.0\./);
        (0, vitest_1.expect)(doc.paths['/__openapi_probe__']).toBeDefined();
        (0, vitest_1.expect)(doc.tags?.some((tag) => tag.name === 'matches')).toBe(true);
        (0, vitest_1.expect)(doc.components?.securitySchemes?.bearerAuth?.type).toBe('http');
    });
});
