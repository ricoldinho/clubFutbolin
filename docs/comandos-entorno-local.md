# Comandos para levantar el entorno local (API + Web + Postgres)

Guía rápida para cualquier máquina nueva (Mac/Windows/Linux) con Docker y Node.js.

## 1) Requisitos previos

- Docker Desktop (o Docker Engine + Compose)
- Node.js 20+ y npm

## 2) Preparar variables de entorno

En la raíz del repo, crea `.env` (si no existe) a partir de `.env.example`.

Valores mínimos recomendados para desarrollo local:

```bash
# PostgreSQL de desarrollo (docker-compose.yml)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=clubfutbolin
DB_PORT=5432

# Prisma/API
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/clubfutbolin"

# PostgreSQL de tests (docker-compose.test.yml)
DATABASE_URL_TEST="postgresql://test:test@localhost:5433/clubfutbolin_test"

# JWT (opcional en local)
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRES_IN=7d
```

## 3) Instalar dependencias del monorepo

Desde la raíz:

```bash
npm install
```

## 4) Levantar PostgreSQL de desarrollo con Docker

```bash
docker compose up -d
```

Comprobar que está arriba:

```bash
docker compose ps
```

Parar cuando termines:

```bash
docker compose down
```

Si quieres borrar también los datos persistidos:

```bash
docker compose down -v
```

## 5) Migrar base de datos de desarrollo

```bash
npm run db:migrate
```

## 6) Cargar datos iniciales (seed)

Esto limpia la BD y genera datos de ejemplo (liga, temporadas, equipos, jugadores, rosters):

```bash
npm run db:seed
```

Opcionalmente puedes personalizar el seed:

```bash
PRISMA_SEED_RANDOM_SEED=42 PRISMA_SEED_ADMIN_PASSWORD=admin123456 PRISMA_SEED_USER_PASSWORD=user123456 npm run db:seed
```

Credenciales útiles tras el seed:

- Admin: `admin@seed.local` / `admin123456` (si no cambiaste `PRISMA_SEED_ADMIN_PASSWORD`)

## 7) Levantar backend Fastify

```bash
npm run dev:api
```

URLs útiles del backend:

- API: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/docs/json`

## 8) Levantar frontend React (Vite)

En otra terminal:

```bash
npm run dev:web
```

Normalmente Vite corre en `http://localhost:5173` (o puerto libre equivalente).

## 9) (Opcional) Entorno de tests de integración

Levantar Postgres exclusivo para tests:

```bash
docker compose -f docker-compose.test.yml up -d
```

Ejecutar tests de integración:

```bash
npm run test:integration
```

Parar Postgres de tests:

```bash
docker compose -f docker-compose.test.yml down
```

