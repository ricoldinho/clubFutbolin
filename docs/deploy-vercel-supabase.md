# Deploy en Vercel + Supabase

Guia para desplegar `apps/api` y `apps/web` usando Supabase Postgres como base de datos.

## Estrategia recomendada

- Proyecto 1 en Vercel: `apps/api` (funcion serverless en `api/index.ts`).
- Proyecto 2 en Vercel: `apps/web` (SPA Vite estatica).
- Base de datos: Supabase Postgres.

## 1) Preparar Supabase

1. Crear proyecto en Supabase.
2. Usar la cadena de conexion Postgres para aplicaciones:

```bash
postgresql://postgres.zvygqjwsfezqkvpqqzqi:[YOUR-PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
```

3. Aplicar migraciones desde local:

```bash
DATABASE_URL="postgresql://postgres.zvygqjwsfezqkvpqqzqi:[YOUR-PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres" npm run db:migrate -w @clubfutbolin/api
```

## 2) Crear proyecto API en Vercel

1. Importar repo en Vercel.
2. Seleccionar `Root Directory = apps/api`.
3. Dejar `vercel.json` activo (en esta carpeta).
4. Configurar variables de entorno en Vercel (Production, Preview):

- `DATABASE_URL=postgresql://postgres.zvygqjwsfezqkvpqqzqi:[YOUR-PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres`
- `NODE_ENV=production`
- `PORT=3000`
- `JWT_SECRET=<secreto_robusto_min_32_chars>`
- `JWT_EXPIRES_IN=7d`
- `JWT_REFRESH_EXPIRES_IN=14d`
- `AUTH_COOKIE_SECURE=true`
- `AUTH_COOKIE_SAME_SITE=lax`
- `TRUST_PROXY=true`
- `CORS_ORIGINS=https://club-futbolin-api.vercel.app`

Notas:
- En produccion, la API aborta si `AUTH_COOKIE_SECURE=false`.
- En produccion, la API aborta si `JWT_SECRET` coincide con secretos inseguros conocidos.

## 3) Crear proyecto Web en Vercel

1. Importar repo en Vercel.
2. Seleccionar `Root Directory = apps/web`.
3. Framework preset: `Vite`.
4. Configurar variable:

- `VITE_API_BASE=https://club-futbolin-m7zjx6v3o-ricoldinhos-projects.vercel.app`

5. Mantener `vercel.json` de `apps/web` para rewrite SPA a `index.html`.

## 4) Ajustar CORS final

Cuando tengas URL final de la web:

- API `CORS_ORIGINS` debe incluir solo dominios oficiales de front (preview/prod).
- Evitar `*` en produccion cuando hay cookies de sesion.

Valores actuales del proyecto:
- Web: `https://club-futbolin-api.vercel.app`
- API: `https://club-futbolin-m7zjx6v3o-ricoldinhos-projects.vercel.app`

## 5) Validacion post-deploy

1. API:
   - `GET /health`
   - `GET /ready`
   - `GET /documentation`
2. Web:
   - Login correcto.
   - Navegacion por rutas directas (refresh en rutas internas) sin 404.
3. Sesion:
   - Cookies `Secure` presentes en entorno HTTPS.
   - Flujo `/auth/login` y `/auth/refresh` funcional.

## 6) Operacion segura

- Rotar `JWT_SECRET` segun politica interna.
- Mantener CI en verde antes de promover a produccion.
- Revisar alertas de seguridad (SCA/SAST/secret scanning) en cada PR.
