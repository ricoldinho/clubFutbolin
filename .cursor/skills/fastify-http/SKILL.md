---
name: fastify-http
description: Define rutas, plugins y handlers en Fastify; usa server.inject() para tests E2E; mapea códigos HTTP (400, 404, 409). Usar cuando se hable de rutas, handlers, HTTP, Fastify, plugins, endpoint o API.
---

# Fastify y capa HTTP

## Cuándo aplicar

- Rutas, handlers, plugins de Fastify, endpoints, API REST.
- Tests E2E con peticiones HTTP (server.inject()).

## Reglas

- **Controladores "tontos":** Solo parsean HTTP, llaman al caso de uso y devuelven respuesta. No poner lógica de negocio en el handler.
- **Errores de dominio:** Los casos de uso pueden lanzar (ej. `EmailAlreadyInUseError`). El handler debe capturar y mapear a códigos: 409 Conflict para email ya en uso, 404 para no encontrado, 400 para validación. No dejar que el throw suba sin traducir.
- **Validación:** Cuando se use Zod, es la fuente de verdad; Fastify valida el input antes de llegar al handler (ver AGENT.md y .cursorrules).
- **Tests E2E:** Usar `server.inject()` para simular peticiones; cubrir happy path y errores 400, 401, 404, 409; validar esquemas de respuesta.

## Referencias

- AGENT.md: convención de errores de dominio y mapeo a 409.
- .cursorrules: controladores tontos, Validación Zod, Aceptación/E2E con server.inject().
