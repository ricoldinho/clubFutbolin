# Agent Context & Project Memory

## Current Status 📍

- **Phase:** Dominio Player, casos de uso (Result), capa HTTP (Fastify + Zod), rutas `/players`, persistencia con Prisma 7 (adapter pg) y Postgres, **autenticación JWT y roles (USER/ADMIN)**. BD de test para integración; CI con unit tests + integration tests (Postgres en el job).
- **Next Task:** (1) Valorar bundler (tsup) y E2E cuando toque despliegue. (2) Nuevas funcionalidades de dominio según producto.
- **Ubicación de código:** Implementaciones de puertos (repos) → `src/adapters/persistence/`. Handlers y rutas HTTP → `src/adapters/http/`.
- **Calidad:** En local y en CI se ejecutan `npm run lint` (ESLint), `npm run typecheck` (tsc --noEmit), `npm run test:coverage` (unit tests en `tests/unit/`) y `npm run test:integration` (tests en `tests/integration/`, con Postgres en el job). Reglas: no-console (usar logger Fastify), no-explicit-any.

## Architecture Decisions 🧠

- **Framework:** Fastify over NestJS for raw performance and low overhead.
- **Validation:** Zod for end-to-end type safety (Schema-to-Type), conectado a Fastify mediante `fastify-type-provider-zod`:
  - El servidor se crea con `.withTypeProvider<ZodTypeProvider>()` y usa `validatorCompiler`/`serializerCompiler` de ese paquete.
  - Cada endpoint HTTP debe declarar sus schemas Zod en la opción `schema` (body, params, querystring) para que Fastify valide antes de entrar al handler.
- **Errors:** Result Pattern en casos de uso: devuelven `Result<T, E>` (éxito/fallo); la capa HTTP desempaqueta y traduce `Result.err` con `mapDomainErrorToHttp`. Solo infraestructura puede lanzar; ver `.cursor/rules/patron-result.mdc`.
- **Identificadores (PostgreSQL):** UUID, preferiblemente **v7** (ordenado en el tiempo). Las entidades usan Value Objects de id (ej. `PlayerId`): `PlayerId.generate()` para nuevos, `PlayerId.fromString(uuid)` al cargar desde BD. En Postgres almacenar como tipo `uuid` (16 bytes); en dominio se trabaja con `PlayerId`, que valida formato UUID.
- **Email único por Player:** Un email solo puede pertenecer a un Player. Se garantiza en el caso de uso `RegisterPlayer` (findByEmail + `EmailAlreadyInUseError`) y en BD con UNIQUE en la columna `email`. El handler HTTP debe mapear `EmailAlreadyInUseError` a **409 Conflict**.
- **Autenticación y roles:** Login con email + contraseña; se devuelve un JWT (header `Authorization: Bearer <token>` en peticiones posteriores). Registro (POST /players) es público; el nuevo Player tiene siempre **role USER**. Solo un Player con **role ADMIN** puede asignar role ADMIN a otro (PATCH /players/:id con `role: "ADMIN"`). Rutas GET /players, GET /players/:id, PATCH, DELETE requieren JWT válido; POST /players y POST /auth/login son públicos.
- **Casos de uso:** Clases con constructor (inyección de dependencias) y método `execute`; no funciones con dependencias como parámetro.

## Tech Debt & Notes 📝

- **Hecho:** Docker Compose para PostgreSQL local; integración Prisma (schema, migraciones, `PrismaPlayerRepository`); BD de test e integration tests; CI con Postgres.
- **Bundler pendiente:** Build actual es `tsc` + `tsconfig-paths` en runtime. Ver `docs/bundler-pendiente.md` para migración a tsup u otro bundler.
- Validación con Zod en Fastify (body/query).
- **PrismaClient:** Una sola instancia por proceso; se crea en `buildServer` (o infraestructura) y se pasa a los repositorios. En tests de integración, cerrar con `prisma.$disconnect()` al terminar.
- **Migraciones Prisma (orden):** Las migraciones se aplican en orden lexicográfico por nombre de carpeta. Para no romper BD limpias (CI, clones), **siempre** generar nuevas migraciones con `npx prisma migrate dev --name descripcion`; no crear carpetas de migración a mano con timestamps que inviertan el orden (p. ej. un ALTER antes del CREATE TABLE). Ver `.cursor/rules/prisma-migraciones-orden.mdc`.
- **BD de tests:** Los tests de integración y E2E usan una `DATABASE_URL` distinta (BD/schema de test). Está permitido borrar datos y resembrar en esa BD; nunca usar la BD de producción o desarrollo para tests automáticos.
- **Taxonomía de errores de dominio y mapeo HTTP:**
  - **Errores compartidos** en `src/domain/shared/errors.ts`: `DomainValidationError` (validación VO/parseo → 400), `NotFoundError` (entidad no encontrada → 404), `InfrastructureError` (fallos BD/red → 500).
  - **Errores de contexto** en el propio dominio (ej. `src/domain/players/errors.ts`): p. ej. `EmailAlreadyInUseError` → 409, `InvalidCredentialsError` → 401. En `src/domain/shared/errors.ts`: `ForbiddenError` → 403.
  - **Mapeo centralizado:** Usar `mapDomainErrorToHttp(error)` de `src/adapters/http/http-error-mapper.ts` en los handlers; no duplicar `if (error instanceof ...)`. Al añadir un nuevo error de dominio, registrar su mapeo en `http-error-mapper.ts`.
  - Ver regla `.cursor/rules/errores-dominio-mapeo-http.mdc`.
- **Patrón Result:** Casos de uso devuelven `Result<T, E>` (no `throw` de dominio ni `null` para no encontrado). HTTP traduce `Result.err` a códigos con `mapDomainErrorToHttp`. Ver `.cursor/rules/patron-result.mdc`.
