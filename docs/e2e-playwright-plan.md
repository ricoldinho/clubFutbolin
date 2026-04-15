# Plan E2E con Playwright

**Estado:** implementado en layout `e2e/` en la raíz, con specs iniciales y job CI dedicado. Este documento queda como referencia de criterios y evolución.

## Objetivo

Cubrir flujos críticos de usuario (login, navegación, formularios) contra la SPA real y el API real (o un entorno de test con BD), sin sustituir los tests de integración HTTP del API (`server.inject()`).

## 38. Ubicación del paquete y configuración

**Opciones de layout (elegir una al implementar):**

| Opción | Ruta | Notas |
|--------|------|--------|
| A | `apps/web-e2e` | Paquete npm workspace (`workspaces: apps/*` o entrada explícita), simétrico con `apps/web`. |
| B | `e2e/` en la raíz | Carpeta dedicada fuera de `apps/`; `package.json` propio o scripts solo en raíz que invoquen Playwright. |

**Contenido mínimo al activar la fase:**

- `playwright.config.ts` (o `.mts`) con:
  - **`baseURL`**: URL del front en ejecución — p. ej. `http://127.0.0.1:5173` (Vite dev) o `http://127.0.0.1:4173` (`vite preview` tras build).
  - Timeouts y `testDir` acordes al repo.
- Carpeta de specs (p. ej. `tests/` o `e2e/specs/`) con `.spec.ts`.
- **Scripts** (convención sugerida):
  - En el paquete E2E: `"test:e2e": "playwright test"`, `"test:e2e:ui": "playwright test --ui"`.
  - En la **raíz** del monorepo: `npm run test:e2e -w @clubfutbolin/web-e2e` (si el workspace se llama así) o `npm run test:e2e` delegando al directorio `e2e/`.

**Dependencias:** `@playwright/test` y, tras `npm install`, `npx playwright install` (navegadores) en local y en CI.

## 39. CI (GitHub Actions)

**Job separado** del job actual `build-and-test`, para:

- No mezclar tiempos de instalación de browsers con lint/typecheck/unit.
- Permitir condiciones distintas (solo en `main`, solo en PR con label, etc.) si el equipo lo decide.

**Estrategias de arranque:**

1. **`webServer` en `playwright.config.ts`:** array de uno o dos comandos — p. ej. levantar API (`npm run start` o `dev` con BD de test) y front (`vite preview` o `dev`). Playwright espera a que respondan las URLs de health o a `url` + `reuseExistingServer`.
2. **Pasos explícitos en el workflow:** `npm run build` API + web, migraciones contra Postgres de servicio (como en integración), en background `node`/`npm run start` para API y `vite preview` para web, luego `npx playwright test`.

**Servicios:** si los E2E necesitan datos persistentes, reutilizar el patrón de Postgres del job de integración (`DATABASE_URL` / `DATABASE_URL_TEST`) y semilla mínima si aplica.

## 40. Alcance actual

- `@playwright/test` está añadido en `e2e/package.json`.
- Configuración activa en `e2e/playwright.config.ts`.
- Job E2E activo en CI con arranque de API + web preview.

## Referencias

- [Playwright — webServer](https://playwright.dev/docs/test-webserver)
- Tests de integración con BD: [testing-db.md](./testing-db.md)
