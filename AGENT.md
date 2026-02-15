# Agent Context & Project Memory

## Current Status 📍

- **Phase:** Initial Scaffolding.
- **Next Task:** Setup Fastify server with Prisma integration and Zod validation.

## Architecture Decisions 🧠

- **Framework:** Fastify over NestJS for raw performance and low overhead.
- **Validation:** Zod for end-to-end type safety (Schema-to-Type).
- **Errors:** Result Pattern (Success/Failure objects) instead of throwing exceptions.

## Tech Debt & Notes 📝

- Need to define the Docker Compose file for local PostgreSQL.
- Need to set up Vitest configuration for the Backend.
