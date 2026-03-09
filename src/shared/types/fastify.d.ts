// src/shared/types/fastify.d.ts
import { Envs } from "../config/env";

declare module "fastify" {
  interface FastifyInstance {
    config: Envs;
  }
}
