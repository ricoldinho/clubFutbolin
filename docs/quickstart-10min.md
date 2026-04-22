# Quick Readme del proyecto

Referencia rapida para entender `clubFutbolin` en menos de 2 minutos.

## Que es

Monorepo fullstack para la gestion de un club/liga de futbolin.

- API en Fastify + Prisma + PostgreSQL.
- Web en React + Vite + TanStack Query.
- Tests unitarios, integracion y E2E.

## Estructura minima

```text
apps/api   -> backend HTTP + dominio + persistencia
apps/web   -> frontend SPA
e2e/       -> tests end-to-end con Playwright
docs/      -> documentacion tecnica y operativa
```

## Flujos funcionales principales

- Auth de jugadores.
- CRUD de jugadores.
- Ligas, temporadas y equipos.
- Roster por equipo/temporada.
- Partidos.

## Primeros comandos utiles

```bash
npm install
npm run dev:api
npm run dev:web
```

Ver guia completa de arranque en `docs/comandos-entorno-local.md`.

## URLs locales

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/documentation`
- Web: `http://localhost:5173`

## Documentos clave de `docs/`

- Arranque completo: `docs/comandos-entorno-local.md`
- Referencia API: `docs/api-reference.md`
- Coleccion HTTP: `docs/api.http`
- Calidad y metricas: `docs/calidad-metricas.md`

