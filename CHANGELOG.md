# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [Unreleased]

### Added

- **Calidad de código:** Scripts `npm run lint` (ESLint) y `npm run typecheck` (tsc --noEmit). Configuración ESLint con `no-console`, `@typescript-eslint/no-explicit-any` y `@typescript-eslint/no-unused-vars` (argsIgnorePattern `^_`). CI ya ejecuta lint, typecheck y test:run.
- **Docker:** Healthcheck en el servicio `db` de docker-compose (pg_isready) para esperar a que Postgres esté listo.
- **Docs:** README con sección "Calidad de código" y tabla de comandos; AGENT.md con estado actual y referencia a lint/typecheck/test.

- **Patrón Result:** Tipo `Result<T, E>` en `src/shared/result.ts` con `Result.ok`, `Result.fail` y type guards `isOk`/`isFail`. Casos de uso `RegisterPlayer`, `GetPlayerById` y `ListPlayers` devuelven Result en lugar de lanzar o devolver `null`; la capa HTTP desempaqueta y traduce `Result.err` con `mapDomainErrorToHttp`. Regla `.cursor/rules/patron-result.mdc` y referencias en `.cursorrules` y `AGENT.md`.

### Changed

- `RegisterPlayer.execute`: devuelve `Result<Player, EmailAlreadyInUseError>` en lugar de lanzar `EmailAlreadyInUseError`.
- `GetPlayerById.execute`: devuelve `Result<Player, NotFoundError>` en lugar de `Player | null`.
- `ListPlayers.execute`: devuelve `Result<Player[], never>` (siempre éxito; infra se captura en HTTP).

## [0.1.0] - 2026-02-15

### Added

- Estructura inicial del proyecto.
- Configuración de `.cursorrules` para desarrollo asistido por IA.
- Definición de arquitectura (Fastify + Prisma + React).
- Archivos de documentación base (README, CHANGELOG, AGENT).
- Dominio Player: entidad con Value Objects (Email, PhoneNumber, Birthdate, PlayerId, PlayerCategory).
- Invariante email único: `IPlayerRepository.findByEmail`, caso de uso `registerPlayer`, error `EmailAlreadyInUseError`.
- Tests en `tests/unit/` con Vitest y patrón AAA; dobles en `tests/doubles/` (ej. `InMemoryPlayerRepository`).
- Skill Cursor **testing-aaa-vitest** para tests con AAA y mocks en memoria.
