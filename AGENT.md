# Agent Context & Project Memory

## Current Status 📍

- **Phase:** Dominio Player, casos de uso (Result), capa HTTP (Fastify + Zod) y rutas `/players` hechas. Siguiente: persistencia (Prisma + Postgres).
- **Next Task:** (1) Docker Compose + Prisma schema para Player. (2) Repositorio Prisma en `src/adapters/persistence/`.
- **Ubicación de código:** Implementaciones de puertos (repos) → `src/adapters/persistence/`. Handlers y rutas HTTP → `src/adapters/http/`.
- **Calidad:** En local y en CI se ejecutan `npm run lint` (ESLint), `npm run typecheck` (tsc --noEmit) y `npm run test:run` (Vitest). Reglas: no-console (usar logger Fastify), no-explicit-any.

## Architecture Decisions 🧠

- **Framework:** Fastify over NestJS for raw performance and low overhead.
- **Validation:** Zod for end-to-end type safety (Schema-to-Type), conectado a Fastify mediante `fastify-type-provider-zod`:
  - El servidor se crea con `.withTypeProvider<ZodTypeProvider>()` y usa `validatorCompiler`/`serializerCompiler` de ese paquete.
  - Cada endpoint HTTP debe declarar sus schemas Zod en la opción `schema` (body, params, querystring) para que Fastify valide antes de entrar al handler.
- **Errors:** Result Pattern en casos de uso: devuelven `Result<T, E>` (éxito/fallo); la capa HTTP desempaqueta y traduce `Result.err` con `mapDomainErrorToHttp`. Solo infraestructura puede lanzar; ver `.cursor/rules/patron-result.mdc`.
- **Identificadores (PostgreSQL):** UUID, preferiblemente **v7** (ordenado en el tiempo). Las entidades usan Value Objects de id (ej. `PlayerId`): `PlayerId.generate()` para nuevos, `PlayerId.fromString(uuid)` al cargar desde BD. En Postgres almacenar como tipo `uuid` (16 bytes); en dominio se trabaja con `PlayerId`, que valida formato UUID.
- **Email único por Player:** Un email solo puede pertenecer a un Player. Se garantiza en el caso de uso `RegisterPlayer` (findByEmail + `EmailAlreadyInUseError`) y en BD con UNIQUE en la columna `email`. El handler HTTP debe mapear `EmailAlreadyInUseError` a **409 Conflict**.
- **Casos de uso:** Clases con constructor (inyección de dependencias) y método `execute`; no funciones con dependencias como parámetro.

## Tech Debt & Notes 📝

- Docker Compose para PostgreSQL local.
- Integración Prisma (schema, migraciones).
- Validación con Zod en Fastify (body/query).
- **Taxonomía de errores de dominio y mapeo HTTP:**
  - **Errores compartidos** en `src/domain/shared/errors.ts`: `DomainValidationError` (validación VO/parseo → 400), `NotFoundError` (entidad no encontrada → 404), `InfrastructureError` (fallos BD/red → 500).
  - **Errores de contexto** en el propio dominio (ej. `src/domain/players/errors.ts`): p. ej. `EmailAlreadyInUseError` → 409.
  - **Mapeo centralizado:** Usar `mapDomainErrorToHttp(error)` de `src/adapters/http/http-error-mapper.ts` en los handlers; no duplicar `if (error instanceof ...)`. Al añadir un nuevo error de dominio, registrar su mapeo en `http-error-mapper.ts`.
  - Ver regla `.cursor/rules/errores-dominio-mapeo-http.mdc`.
- **Patrón Result:** Casos de uso devuelven `Result<T, E>` (no `throw` de dominio ni `null` para no encontrado). HTTP traduce `Result.err` a códigos con `mapDomainErrorToHttp`. Ver `.cursor/rules/patron-result.mdc`.
