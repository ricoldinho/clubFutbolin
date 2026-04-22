# Practicas y metricas de calidad

Documento operativo para mantener calidad tecnica en `clubFutbolin`.

## 1) Puertas minimas antes de merge

Checklist recomendado para PR:

- `npm run lint`
- `npm run typecheck`
- `npm run test:run`
- `npm run test:integration` (si el cambio toca API/persistencia)
- `npm run test:e2e` (si el cambio toca flujos de usuario)

Si una puerta no aplica al cambio, dejarlo explicado en la descripcion del PR.

## 2) Practicas tecnicas obligatorias

- Mantener tipado estricto, sin `any`.
- Validar entrada HTTP con Zod.
- Mapear errores de dominio a HTTP de forma explicita.
- Añadir/actualizar tests cuando se modifique comportamiento.
- No mezclar cambios funcionales con refactors masivos no solicitados.

## 3) Metricas de calidad sugeridas

## Salud del codigo

- Lint en verde.
- Typecheck en verde.
- Cero errores de build (`npm run build`).

## Salud de pruebas

- Unitarias en verde (`npm run test:run`).
- Integracion en verde (`npm run test:integration`).
- E2E en verde en CI para flujos criticos.

## Cobertura (orientativa)

- API: mantener cobertura estable o creciente.
- Web: mantener cobertura estable en features criticos.

No usar porcentaje de cobertura como objetivo aislado; priorizar tests de comportamiento.

## 4) Seguridad y hardening

- Revisar `security-baseline.md` antes de releases.
- Mantener `AUTH_COOKIE_SECURE=true` fuera de local.
- Revisar picos de `401`, `403` y `429` en operacion.
- Gestionar excepciones temporales en `security-vulnerability-exceptions.md`.

## 5) Documentacion minima a actualizar por cambio

Cuando cambie contrato HTTP:
- `docs/api-reference.md`
- `docs/api.http`

Cuando cambie bootstrap/entorno local:
- `docs/comandos-entorno-local.md`

Cuando cambie criterio de calidad:
- este documento (`docs/calidad-metricas.md`)
