# Agent Context & Project Memory

## Current Status 📍

- **Phase:** Domain y casos de uso en marcha; siguiente: capa HTTP (Fastify) y/o persistencia (Prisma + Postgres).
- **Next Task:** (1) Docker Compose + Prisma schema para Player. (2) Rutas Fastify + Zod para registrar/consultar Player.
- **Ubicación de código:** Implementaciones de puertos (repos) → `src/adapters/persistence/`. Handlers y rutas HTTP → `src/adapters/http/`.

## Architecture Decisions 🧠

- **Framework:** Fastify over NestJS for raw performance and low overhead.
- **Validation:** Zod for end-to-end type safety (Schema-to-Type).
- **Errors:** Result Pattern (Success/Failure objects) instead of throwing exceptions.
- **Identificadores (PostgreSQL):** UUID, preferiblemente **v7** (ordenado en el tiempo). Las entidades usan Value Objects de id (ej. `PlayerId`): `PlayerId.generate()` para nuevos, `PlayerId.fromString(uuid)` al cargar desde BD. En Postgres almacenar como tipo `uuid` (16 bytes); en dominio se trabaja con `PlayerId`, que valida formato UUID.
- **Email único por Player:** Un email solo puede pertenecer a un Player. Se garantiza en el caso de uso `RegisterPlayer` (findByEmail + `EmailAlreadyInUseError`) y en BD con UNIQUE en la columna `email`. El handler HTTP debe mapear `EmailAlreadyInUseError` a **409 Conflict**.
- **Casos de uso:** Clases con constructor (inyección de dependencias) y método `execute`; no funciones con dependencias como parámetro.

## Tech Debt & Notes 📝

- Docker Compose para PostgreSQL local.
- Integración Prisma (schema, migraciones).
- Validación con Zod en Fastify (body/query).
- **Convención de errores de dominio:** Los casos de uso pueden lanzar errores de dominio (ej. `EmailAlreadyInUseError`); el handler HTTP debe capturarlos y mapear a códigos (409, 404, etc.), no dejar que el `throw` suba sin traducir.
