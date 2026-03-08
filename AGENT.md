# Agent Context & Project Memory

## Current Status 📍

- **Phase:** Initial Scaffolding.
- **Next Task:** Setup Fastify server with Prisma integration and Zod validation.

## Architecture Decisions 🧠

- **Framework:** Fastify over NestJS for raw performance and low overhead.
- **Validation:** Zod for end-to-end type safety (Schema-to-Type).
- **Errors:** Result Pattern (Success/Failure objects) instead of throwing exceptions.
- **Identificadores (PostgreSQL):** UUID, preferiblemente **v7** (ordenado en el tiempo). Las entidades usan Value Objects de id (ej. `PlayerId`): `PlayerId.generate()` para nuevos, `PlayerId.fromString(uuid)` al cargar desde BD. En Postgres almacenar como tipo `uuid` (16 bytes); en dominio se trabaja con `PlayerId`, que valida formato UUID.
- **Email único por Player:** Un email solo puede pertenecer a un Player. El caso de uso `registerPlayer` comprueba `findByEmail` antes de crear y lanza `EmailAlreadyInUseError` si ya existe (HTTP 409). En BD, columna `email` con restricción UNIQUE.

## Tech Debt & Notes 📝

- Need to define the Docker Compose file for local PostgreSQL.
- Need to set up Vitest configuration for the Backend.
