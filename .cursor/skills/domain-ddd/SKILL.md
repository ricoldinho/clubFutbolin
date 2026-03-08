---
name: domain-ddd
description: Trabaja con entidades, value objects, puertos de repositorio, errores de dominio e invariantes. Usar cuando se hable de entidad, value object, repositorio, dominio, agregado o invariante.
---

# Dominio y DDD

## Cuándo aplicar

- Entidades, value objects, agregados, puertos de repositorio, errores de dominio, invariantes.

## Reglas

- **Sin infra en dominio:** El dominio no depende de Prisma, HTTP ni frameworks. Repositorios son puertos (interfaces) en dominio; las implementaciones viven en infraestructura.
- **Value Objects:** Validan en `create()` (Fail Fast). El dominio solo acepta tipos validados (ej. `Email`, `PlayerId`, no string crudo para email/id).
- **Invariantes:** Se documentan en la entidad y se garantizan en los casos de uso (ej. "un email solo puede pertenecer a un Player" → `registerPlayer` llama a `findByEmail` antes de crear; ver AGENT.md).
- **Errores de dominio:** Clases propias (ej. `EmailAlreadyInUseError`); la capa HTTP los traduce a códigos.

## Referencias

- AGENT.md: UUID/PlayerId, email único, convención de errores.
- .cursorrules: Result Pattern, Screaming Architecture, Vertical Slicing.
