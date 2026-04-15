# Agent Context & Project Memory

## Current Status 📍

- **Phase:** Dominio Player + **módulos leagues, teams, seasons, rosters, matches** con Result pattern. API endurecida con CORS/Helmet/RateLimit, métricas básicas (`/metrics`) y health/readiness (`/health`, `/ready`). Auth de sesión por cookies httpOnly con refresh rotation (`/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/session`).
- **Next Task:** (1) Afinar umbrales de cobertura frontend de forma incremental. (2) Robustecer política de seguridad de cookies en producción (`AUTH_COOKIE_SECURE=true`, dominios definitivos). (3) Estabilizar flujos E2E de Playwright en CI según datos seed.
- **Ubicación de código:** Monorepo npm (`workspaces: apps/*`). API en **`apps/api`**: puertos → `apps/api/src/adapters/persistence/`. HTTP → `apps/api/src/adapters/http/`. Prisma → `apps/api/prisma/`. Tests → `apps/api/tests/`. Web en **`apps/web`**: Vite + React, features bajo `apps/web/src/features/`, cliente HTTP en `apps/web/src/api/`.
- **Calidad:** En raíz: `npm run lint`, `npm run typecheck`, `npm run test:run`, `npm run test:coverage`, `npm run test:coverage:web`, `npm run test:integration` y `npm run test:e2e`. Unit tests API en `apps/api/tests/unit/`; integración en `apps/api/tests/integration/`; E2E en `e2e/tests/` con Playwright. Prettier: `npm run format` / `format:check`.

## Architecture Decisions 🧠

- **Framework:** Fastify over NestJS for raw performance and low overhead.
- **Validation:** Zod for end-to-end type safety (Schema-to-Type), conectado a Fastify mediante `fastify-type-provider-zod`:
  - El servidor se crea con `.withTypeProvider<ZodTypeProvider>()` y usa `validatorCompiler`/`serializerCompiler` de ese paquete.
  - Cada endpoint HTTP debe declarar sus schemas Zod en la opción `schema` (body, params, querystring) para que Fastify valide antes de entrar al handler.
- **Errors:** Result Pattern en casos de uso: devuelven `Result<T, E>` (éxito/fallo); la capa HTTP desempaqueta y traduce `Result.err` con `mapDomainErrorToHttp`. Solo infraestructura puede lanzar; ver `.cursor/rules/patron-result.mdc`.
- **Identificadores (PostgreSQL):** UUID, preferiblemente **v7** (ordenado en el tiempo). Las entidades usan Value Objects de id (ej. `PlayerId`): `PlayerId.generate()` para nuevos, `PlayerId.fromString(uuid)` al cargar desde BD. En Postgres almacenar como tipo `uuid` (16 bytes); en dominio se trabaja con `PlayerId`, que valida formato UUID.
- **Email único por Player:** Un email solo puede pertenecer a un Player. Se garantiza en el caso de uso `RegisterPlayer` (findByEmail + `EmailAlreadyInUseError`) y en BD con UNIQUE en la columna `email`. El handler HTTP debe mapear `EmailAlreadyInUseError` a **409 Conflict**.
- **Autenticación y roles:** Login con email + contraseña y cookies `httpOnly` (`access` + `refresh`). `POST /auth/refresh` rota refresh token y renueva access cookie; `POST /auth/logout` limpia cookies; `GET /auth/session` devuelve identidad autenticada. `createRequireAuth` acepta Bearer o access cookie; `createRequireAdmin` exige role ADMIN.
- **Casos de uso:** Clases con constructor (inyección de dependencias) y método `execute`; no funciones con dependencias como parámetro.

## Tech Debt & Notes 📝

- **Hecho:** Docker Compose para PostgreSQL local; integración Prisma (schema, migraciones, `PrismaPlayerRepository`); BD de test e integration tests; CI con Postgres.
- **E2E (hecho):** Playwright activo en `e2e/` con specs de navegación/auth y job CI dedicado.
- **Bundler (hecho):** API empaquetada con `tsup`; `start` ya no depende de `tsconfig-paths/register`.
- Validación con Zod en Fastify (body/query).
- **PrismaClient:** Una sola instancia por proceso; se crea en `buildServer` (o infraestructura) y se pasa a los repositorios. En tests de integración, cerrar con `prisma.$disconnect()` al terminar.
- **Migraciones Prisma (orden):** Las migraciones se aplican en orden lexicográfico por nombre de carpeta. Para no romper BD limpias (CI, clones), **siempre** generar nuevas migraciones con `npx prisma migrate dev --name descripcion`; no crear carpetas de migración a mano con timestamps que inviertan el orden (p. ej. un ALTER antes del CREATE TABLE). Ver `.cursor/rules/prisma-migraciones-orden.mdc`.
- **BD de tests:** Los tests de integración y E2E usan una `DATABASE_URL` distinta (BD/schema de test). Está permitido borrar datos y resembrar en esa BD; nunca usar la BD de producción o desarrollo para tests automáticos.
- **Taxonomía de errores de dominio y mapeo HTTP (API):**
  - **Errores compartidos** en `apps/api/src/domain/shared/errors.ts`: `DomainValidationError` (validación VO/parseo → 400), `NotFoundError` (entidad no encontrada → 404), `InfrastructureError` (fallos BD/red → 500).
  - **Errores de contexto** en el propio dominio (ej. `apps/api/src/domain/players/errors.ts`): p. ej. `EmailAlreadyInUseError` → 409, `InvalidCredentialsError` → 401. En `apps/api/src/domain/shared/errors.ts`: `ForbiddenError` → 403.
  - **Mapeo centralizado:** Usar `mapDomainErrorToHttp(error)` de `apps/api/src/adapters/http/http-error-mapper.ts` en los handlers; no duplicar `if (error instanceof ...)`. Al añadir un nuevo error de dominio, registrar su mapeo en `http-error-mapper.ts`.
  - Ver regla `.cursor/rules/errores-dominio-mapeo-http.mdc`.
- **Patrón Result:** Casos de uso devuelven `Result<T, E>` (no `throw` de dominio ni `null` para no encontrado). HTTP traduce `Result.err` a códigos con `mapDomainErrorToHttp`. Ver `.cursor/rules/patron-result.mdc`.
