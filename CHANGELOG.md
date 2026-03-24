# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [Unreleased]

### Added

- **Dimensionalidad temporal y Ligas/Equipos:** Nuevos módulos con vertical slicing (domain, ports, use-cases, adapters): `leagues`, `teams`, `seasons`, `rosters`. Schema Prisma: League, Team, Season, TeamSeason, RosterPlayer; enum Position (PORTERO, DELANTERO). Player sin campo `league`; relación 1-N con RosterPlayer. Rutas HTTP: /leagues, /teams, /seasons, /rosters (register, add/remove players). Admin-only con `createRequireAdmin`. Aggregate Root `TeamRoster` con reglas: max 4 jugadores, sin duplicados. Season con `setWinners(championId, secondId)` (ids distintos). Migración `20260315000001_add_leagues_teams_seasons_rosters` (después de `init`). Error `AlreadyExistsError` (409).
- **Seguridad y roles:** Autenticación con email + contraseña; JWT (jose) para sesión; roles USER y ADMIN en Player. Registro público con role USER por defecto; solo un ADMIN puede asignar role ADMIN a otro. POST /auth/login (body: email, password) devuelve `{ token, expiresIn }`. Rutas GET /players, GET /players/:id, PATCH, DELETE requieren header `Authorization: Bearer <token>`. Puertos `IPasswordHasher` (bcrypt) e `IJwtService`; errores `InvalidCredentialsError` (401) y `ForbiddenError` (403). Variables de entorno `JWT_SECRET` y `JWT_EXPIRES_IN`.
- **Tests:** Test unitario para `LoginPlayer` (credenciales inválidas y éxito) y para regla "USER no puede asignar ADMIN" en UpdatePlayer.
- **Tests:** Test unitario para el caso de uso `ListPlayers` (`tests/unit/application/use-cases/players/ListPlayers.use-case.test.ts`): lista vacía y lista con jugadores; mismo estilo AAA y `InMemoryPlayerRepository` que el resto de use cases.
- **Calidad:** Umbrales de cobertura en Vitest (`lines`, `functions`, `branches` al 80 %); `npm run test:coverage` falla si la cobertura baja del mínimo.

- **Calidad de código:** Scripts `npm run lint` (ESLint) y `npm run typecheck` (tsc --noEmit). Configuración ESLint con `no-console`, `@typescript-eslint/no-explicit-any` y `@typescript-eslint/no-unused-vars` (argsIgnorePattern `^_`). CI ya ejecuta lint, typecheck y test:run.
- **Docker:** Healthcheck en el servicio `db` de docker-compose (pg_isready) para esperar a que Postgres esté listo.
- **Docs:** README con sección "Calidad de código" y tabla de comandos; AGENT.md con estado actual y referencia a lint/typecheck/test.

- **Patrón Result:** Tipo `Result<T, E>` en `src/shared/result.ts` con `Result.ok`, `Result.fail` y type guards `isOk`/`isFail`. Casos de uso `RegisterPlayer`, `GetPlayerById` y `ListPlayers` devuelven Result en lugar de lanzar o devolver `null`; la capa HTTP desempaqueta y traduce `Result.err` con `mapDomainErrorToHttp`. Regla `.cursor/rules/patron-result.mdc` y referencias en `.cursorrules` y `AGENT.md`.

### Changed

- **AGENT.md:** Phase y Next Task actualizados (persistencia con Prisma hecha; siguiente: doc/tests pendientes y valorar bundler/E2E). Calidad: se documentan `test:coverage` y `test:integration` y la ubicación de tests (`tests/unit/`, `tests/integration/`). Tech Debt: Docker Compose e integración Prisma marcados como hechos; añadido "Bundler pendiente" con referencia a `docs/bundler-pendiente.md`.
- **RegisterPlayer:** Acepta `password` en el input; la contraseña se hashea (bcrypt) y se persiste; el nuevo Player tiene siempre role USER.
- **UpdatePlayer, GetPlayerById, DeletePlayer:** Reciben un "actor" (id + role) y devuelven `ForbiddenError` (403) cuando el actor no tiene permiso (p. ej. USER intentando asignar ADMIN, o ver/eliminar otro jugador sin ser ADMIN).
- `RegisterPlayer.execute`: devuelve `Result<Player, EmailAlreadyInUseError>` en lugar de lanzar `EmailAlreadyInUseError`.
- `GetPlayerById.execute`: devuelve `Result<Player, NotFoundError | ForbiddenError>` con actor.
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
