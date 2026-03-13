---
name: prisma-postgres
description: Schema Prisma, migraciones e implementación de repositorios (ej. IPlayerRepository) con Postgres; select explícito, tipo uuid para ids. Usar con Prisma, schema, migración, repositorio Postgres o Docker Postgres.
---

# Prisma y PostgreSQL

## Cuándo aplicar

- Schema de Prisma, migraciones, implementación de puertos de repositorio (ej. `IPlayerRepository`).
- Docker Compose para Postgres local.

## Reglas

- **Ids:** Tipo `uuid` en Postgres; en schema Prisma usar tipo que mapee a `uuid` (ej. `String @db.Uuid`). El dominio usa Value Objects (ej. `PlayerId`); al persistir usar `player.id.value`.
- **Select explícito:** No traer campos innecesarios; usar `select` en las queries para mejor rendimiento (.cursorrules).
- **Repositorios:** Implementar las interfaces del dominio (ej. `findByEmail`, `findById`, `save`); mapear filas a entidades y Value Objects (Email, PlayerId, etc.).
- **Email único:** Columna `email` con restricción UNIQUE (AGENT.md).
- **PrismaClient singleton:** Crear una sola instancia de `PrismaClient` por proceso y compartirla entre repositorios. Cerrar el cliente al finalizar la app o los tests.
- **BD de test:** Definir una `DATABASE_URL` específica para tests (otra BD/schema). Limpiar tablas entre tests sin afectar a desarrollo/producción.

## Referencias

- AGENT.md: UUID v7, email único, Docker/Prisma en Tech Debt.
- .cursorrules: Prisma con select explícito, tests de integración con BD real.
