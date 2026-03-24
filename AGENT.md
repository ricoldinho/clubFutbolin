# Agent Context & Project Memory

## Current Status 📍

- **Phase:** Dominio Player + **módulos leagues, teams, seasons, rosters** (dimensionalidad temporal). Casos de uso (Result), capa HTTP (Fastify + Zod), persistencia Prisma, autenticación JWT y roles (USER/ADMIN). Rutas: `/players`, `/leagues`, `/teams`, `/seasons`, `/rosters/*`. BD de test; CI con unit + integration tests.
- **Next Task:** (1) Migración de BD: `npm run db:migrate -w @clubfutbolin/api` cuando la BD esté levantada. (2) Tests de integración para PrismaSeasonRepository, PrismaRosterRepository. (3) E2E: plan reservado en **`docs/e2e-playwright-plan.md`** (Fase 10 — Playwright, `apps/web-e2e` o `e2e/`, job CI separado; sin instalar en la primera iteración).
- **Ubicación de código:** Monorepo npm (`workspaces: apps/*`). API en **`apps/api`**: puertos → `apps/api/src/adapters/persistence/`. HTTP → `apps/api/src/adapters/http/`. Prisma → `apps/api/prisma/`. Tests → `apps/api/tests/`. Web en **`apps/web`**: Vite + React, features bajo `apps/web/src/features/`, cliente HTTP en `apps/web/src/api/`.
- **Calidad:** En raíz: `npm run lint` (API + web), `npm run typecheck` (`tsc -b` API + web + tests API), `npm run test:*` del API; web: `npm run test:run -w @clubfutbolin/web`. Unit tests API en `apps/api/tests/unit/`; integración en `apps/api/tests/integration/` (Postgres en CI). Prettier: `npm run format` / `format:check`. Reglas API: no-console (logger Fastify), no-explicit-any.

## Architecture Decisions 🧠

- **Framework:** Fastify over NestJS for raw performance and low overhead.
- **Validation:** Zod for end-to-end type safety (Schema-to-Type), conectado a Fastify mediante `fastify-type-provider-zod`:
  - El servidor se crea con `.withTypeProvider<ZodTypeProvider>()` y usa `validatorCompiler`/`serializerCompiler` de ese paquete.
  - Cada endpoint HTTP debe declarar sus schemas Zod en la opción `schema` (body, params, querystring) para que Fastify valide antes de entrar al handler.
- **Errors:** Result Pattern en casos de uso: devuelven `Result<T, E>` (éxito/fallo); la capa HTTP desempaqueta y traduce `Result.err` con `mapDomainErrorToHttp`. Solo infraestructura puede lanzar; ver `.cursor/rules/patron-result.mdc`.
- **Identificadores (PostgreSQL):** UUID, preferiblemente **v7** (ordenado en el tiempo). Las entidades usan Value Objects de id (ej. `PlayerId`): `PlayerId.generate()` para nuevos, `PlayerId.fromString(uuid)` al cargar desde BD. En Postgres almacenar como tipo `uuid` (16 bytes); en dominio se trabaja con `PlayerId`, que valida formato UUID.
- **Email único por Player:** Un email solo puede pertenecer a un Player. Se garantiza en el caso de uso `RegisterPlayer` (findByEmail + `EmailAlreadyInUseError`) y en BD con UNIQUE en la columna `email`. El handler HTTP debe mapear `EmailAlreadyInUseError` a **409 Conflict**.
- **Autenticación y roles:** Login con email + contraseña; JWT en `Authorization: Bearer <token>`. Registro (POST /players) público con role USER. Solo ADMIN puede asignar ADMIN. `createRequireAuth` exige JWT; `createRequireAdmin` exige JWT + role ADMIN. Rutas CRUD de leagues, teams, seasons, rosters (register, add/remove players) son Admin-only; List/Get públicos.
- **Casos de uso:** Clases con constructor (inyección de dependencias) y método `execute`; no funciones con dependencias como parámetro.

## Tech Debt & Notes 📝

- **Hecho:** Docker Compose para PostgreSQL local; integración Prisma (schema, migraciones, `PrismaPlayerRepository`); BD de test e integration tests; CI con Postgres.
- **Pendiente (E2E):** Playwright documentado en `docs/e2e-playwright-plan.md` — `playwright.config` con `baseURL` del front (dev/preview), scripts `test:e2e`, job CI independiente con `webServer` o procesos API+web; no añadido al repo hasta que se priorice.
- **Bundler pendiente:** Build actual es `tsc` + `tsconfig-paths` en runtime. Ver `docs/bundler-pendiente.md` para migración a tsup u otro bundler.
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
