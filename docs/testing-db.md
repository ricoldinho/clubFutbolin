# Base de datos para tests de integración y e2e

La app usa una **base de datos dedicada solo a tests** para integración y e2e. Así no se mezclan datos de desarrollo y los tests son repetibles.

## Plan (pasos)

| Paso | Descripción | Estado |
|------|-------------|--------|
| 1 | Variable `DATABASE_URL_TEST` y `.env.example` | ✅ |
| 2 | Docker Compose para Postgres de test en local | ✅ |
| 3 | Config Vitest y scripts para tests de integración | ✅ |
| 4 | Setup global (migraciones) para integración | ✅ |
| 5 | Primer test de integración con PrismaPlayerRepository | ✅ |
| 6 | CI con servicio Postgres y tests de integración | ✅ |

## Paso 2: Postgres de test en local (Docker)

Archivo: `docker-compose.test.yml`. Levanta un Postgres 16 en el **puerto 5433** (para no chocar con el de desarrollo en 5432).

**Comandos:**

```bash
# Levantar (en segundo plano)
docker compose -f docker-compose.test.yml up -d

# Comprobar que está listo (healthcheck)
docker compose -f docker-compose.test.yml ps

# Parar
docker compose -f docker-compose.test.yml down
```

**Credenciales por defecto:** usuario `test`, contraseña `test`, base de datos `clubfutbolin_test`.  
En `.env` define `DATABASE_URL_TEST="postgresql://test:test@localhost:5433/clubfutbolin_test"` (o copia de `.env.example`).

## Paso 3: Config Vitest y scripts para integración

- **`vitest.config.integration.ts`**: ejecuta solo los tests en `tests/integration/**/*.test.ts`, con timeouts más altos (10 s test, 15 s hooks). No incluye coverage.
- **`vitest.setup.integration.ts`**: carga `.env`, exige `DATABASE_URL_TEST` y asigna `process.env.DATABASE_URL = DATABASE_URL_TEST` para que Prisma use la BD de test.
- **Script:** `npm run test:integration` — corre solo la suite de integración.

Los **tests unitarios** siguen con la config por defecto (`tests/unit/**/*.test.ts`). Así `npm run test` y `npm run test:coverage` no requieren BD.

## Paso 4: Setup global (migraciones)

Antes de ejecutar los tests de integración, Vitest aplica las migraciones Prisma a la BD de test:

- **`vitest.globalSetup.integration.ts`**: carga `.env`, exige `DATABASE_URL_TEST`, asigna `DATABASE_URL` y ejecuta `npx prisma migrate deploy`. Así la BD de test tiene el esquema actualizado en cada run.

## Paso 5: Primer test de integración

- **`tests/integration/adapters/persistence/players/PrismaPlayerRepository.integration.test.ts`**: tests contra BD real para `save`, `findById`, `findAll`, `findByEmail` y `delete`. Cada test deja la tabla `Player` vacía (`beforeEach` con `deleteMany`).

## Paso 6: CI con Postgres y tests de integración

En **`.github/workflows/ci.yml`**:

- **Servicio `postgres`:** imagen `postgres:16-alpine`, usuario/contraseña/BD `test`/`test`/`clubfutbolin_test`, puerto 5432, healthcheck con `pg_isready`.
- **Variables de entorno del job:** `DATABASE_URL` y `DATABASE_URL_TEST` apuntan a ese servicio (`postgresql://test:test@localhost:5432/clubfutbolin_test`).
- **Pasos:** tras unit tests (`npm run test:coverage`), se ejecuta `npm run test:integration`. El globalSetup aplica migraciones y la suite de integración corre contra el Postgres del job.

En CI no hace falta `.env`: las URLs se inyectan desde el workflow.

## Uso (cuando esté todo montado)

1. **Local:** Levantar Postgres de test: `docker compose -f docker-compose.test.yml up -d`.
2. Definir `DATABASE_URL_TEST` en `.env` (o copiar de `.env.example`).
3. Ejecutar tests de integración: `npm run test:integration`.

En **CI** la URL de test se inyecta automáticamente y el workflow levanta un servicio Postgres.
