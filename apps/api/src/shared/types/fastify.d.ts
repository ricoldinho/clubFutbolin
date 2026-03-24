// src/shared/types/fastify.d.ts
import { Envs } from "../config/env";

export interface AuthUser {
  playerId: string;
  role: string;
}

declare module "fastify" {
  interface FastifyInstance {
    config: Envs;
  }

  interface FastifyRequest {
    user?: AuthUser;
  }
}
