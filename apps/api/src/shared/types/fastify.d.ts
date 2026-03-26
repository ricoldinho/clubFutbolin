// src/shared/types/fastify.d.ts
import { Envs } from "../config/env";
import type { AwilixContainer } from "awilix";
import type { AppContainerCradle } from "../di/container";

export interface AuthUser {
  playerId: string;
  role: string;
}

declare module "fastify" {
  interface FastifyInstance {
    config: Envs;
    container: AwilixContainer<AppContainerCradle>;
  }

  interface FastifyRequest {
    user?: AuthUser;
    container: AwilixContainer<AppContainerCradle>;
  }
}
