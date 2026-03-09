# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [Unreleased]

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
