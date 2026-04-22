# Índice de documentación

Guía de navegación rápida de la documentación de `clubFutbolin`.

## Si acabas de llegar al proyecto

1. Lee `quickstart-10min.md` para entender el proyecto en 2 minutos.
2. Sigue `comandos-entorno-local.md` para levantar DB + API + web en local.
3. Usa `api.http` para probar endpoints de forma manual.

## Documentos por objetivo

### Arranque y entorno local

- `comandos-entorno-local.md`: bootstrap completo del monorepo (variables, Docker, Prisma, API y web).
- `quickstart-10min.md`: visión ejecutiva rápida del proyecto.

### API y contrato HTTP

- `api-reference.md`: referencia funcional de endpoints, auth, payloads y respuestas.
- `api.http`: colección de requests para ejecutar desde cliente HTTP.

### Calidad y pruebas

- `calidad-metricas.md`: prácticas técnicas y puertas de calidad antes de merge.
- `testing-db.md`: estrategia de base de datos para tests de integración y E2E.
- `e2e-playwright-plan.md`: alcance y criterios E2E con Playwright y CI.

### Seguridad

- `security-baseline.md`: baseline por entorno (local, staging, producción).
- `security-incident-runbook.md`: respuesta operativa ante incidentes.
- `security-vulnerability-exceptions.md`: política de excepciones temporales.

### Deploy

- `deploy-vercel-supabase.md`: despliegue de API y web en Vercel con Supabase.
- Web desplegada: `https://club-futbolin-api.vercel.app`
- API desplegada: `https://club-futbolin-m7zjx6v3o-ricoldinhos-projects.vercel.app`

## Reglas de mantenimiento de documentación

- Si cambia un endpoint o contrato HTTP, actualizar:
  - `api-reference.md`
  - `api.http`
- Si cambia el flujo de arranque local, actualizar:
  - `comandos-entorno-local.md`
- Si cambian criterios de validación de PR/calidad, actualizar:
  - `calidad-metricas.md`

## Ruta recomendada según perfil

- **Nuevo desarrollador**: `quickstart-10min.md` -> `comandos-entorno-local.md` -> `api.http`
- **Backend/API**: `api-reference.md` -> `api.http` -> `testing-db.md`
- **Release/operación**: `calidad-metricas.md` -> `security-baseline.md` -> `deploy-vercel-supabase.md`
