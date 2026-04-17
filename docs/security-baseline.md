# Security Baseline (clubFutbolin)

Este documento define el baseline de seguridad por entorno para `apps/api` y `apps/web`.

## Objetivos

- Reducir riesgo de abuso de API (OWASP API Top 10).
- Endurecer gestión de sesión basada en cookies.
- Evitar despliegues inseguros por configuración.

## Politica por entorno

### Desarrollo local

- `AUTH_COOKIE_SECURE=false` permitido solo para localhost.
- `CORS_ORIGINS` puede incluir `localhost` y `127.0.0.1`.
- `JWT_SECRET` de desarrollo permitido, nunca reutilizar en staging/prod.

### Staging

- `AUTH_COOKIE_SECURE=true`.
- `CORS_ORIGINS` restringido a dominios de staging.
- TLS obligatorio en todo el tráfico externo.
- `TRUST_PROXY=true` si corre tras ingress/reverse proxy.

### Produccion

- `AUTH_COOKIE_SECURE=true` (hard requirement).
- `AUTH_COOKIE_SAME_SITE=lax` (o `strict` cuando no rompa UX).
- CORS cerrado a frontend oficial (sin wildcard).
- TLS obligatorio end-to-end.
- `JWT_SECRET` robusto (>= 32 chars, aleatorio) y rotacion planificada.

## Checklist de release segura

- [ ] `npm run lint` y `npm run typecheck` en verde.
- [ ] `npm run test:coverage` y `npm run test:integration` en verde.
- [ ] CI de seguridad en verde (SCA/SAST/secret scanning).
- [ ] Variables de entorno de prod revisadas (`AUTH_COOKIE_SECURE`, `CORS_ORIGINS`, `JWT_SECRET`).
- [ ] No hay secretos en repo ni en artefactos de build.
- [ ] Se registraron excepciones de seguridad con fecha de expiracion.

## Operacion y monitoreo

- Monitorizar volumen de `401`, `403` y `429`.
- Alertar picos de login fallido (posible brute force).
- Revisar alertas de Snyk, CodeQL y secret scanning en cada PR.
