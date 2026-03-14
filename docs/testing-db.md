# Base de datos para tests de integración y e2e

La app usa una **base de datos dedicada solo a tests** para integración y e2e. Así no se mezclan datos de desarrollo y los tests son repetibles.

## Plan (pasos)

| Paso | Descripción | Estado |
|------|-------------|--------|
| 1 | Variable `DATABASE_URL_TEST` y `.env.example` | ✅ |
| 2 | Docker Compose para Postgres de test en local | Pendiente |
| 3 | Config Vitest y scripts para tests de integración | Pendiente |
| 4 | Setup global (migraciones) para integración | Pendiente |
| 5 | Primer test de integración con PrismaPlayerRepository | Pendiente |
| 6 | CI con servicio Postgres y tests de integración | Pendiente |

## Uso (cuando esté todo montado)

1. **Local:** Levantar Postgres de test (p. ej. `docker compose -f docker-compose.test.yml up -d`).
2. Definir `DATABASE_URL_TEST` en `.env` (o copiar de `.env.example`).
3. Ejecutar tests de integración: `npm run test:integration`.

En **CI** la URL de test se inyecta automáticamente y el workflow levanta un servicio Postgres.
