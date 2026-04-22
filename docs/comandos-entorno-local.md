# Arranque local del monorepo (DB + API + Web)

Documento unico para levantar el entorno local completo de `clubFutbolin`.

## 1) Requisitos

- Node.js `>=20 <26`
- npm `>=10 <12`
- Docker + Docker Compose

## 2) Variables de entorno

Desde la raiz del repo:

```bash
cp env.template .env
```

Valores minimos recomendados para local:

```bash
PORT=3000
DB_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change_me
POSTGRES_DB=clubfutbolin
DATABASE_URL="postgresql://postgres:change_me@localhost:5432/clubfutbolin"
DATABASE_URL_TEST="postgresql://test:test@localhost:5433/clubfutbolin_test"
JWT_SECRET=dev-secret-change-in-production-1234567890
```

## 3) Instalar dependencias

```bash
npm install
```

## 4) Levantar base de datos local

```bash
docker compose up -d db
```

Comprobar estado:

```bash
docker compose ps
```

## 5) Preparar Prisma

```bash
npm run db:generate
npm run db:migrate
```

Opcional: cargar datos semilla.

```bash
npm run db:seed
```

Credenciales seed por defecto:
- Admin: `admin@seed.local` / `admin123456`
- User: `user@seed.local` / `user123456`

## 6) Arrancar API y Web

Terminal 1 (API):

```bash
npm run dev:api
```

Terminal 2 (Web):

```bash
npm run dev:web
```

URLs utiles:
- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/documentation`
- Web: `http://localhost:5173`

## 7) Entorno de tests de integracion (opcional)

Levantar Postgres de tests:

```bash
docker compose -f docker-compose.test.yml up -d
```

Ejecutar integracion API:

```bash
npm run test:integration
```

Parar Postgres de tests:

```bash
docker compose -f docker-compose.test.yml down
```

## 8) Parada del entorno local

Parar DB de desarrollo:

```bash
docker compose down
```

Parar y borrar volumenes:

```bash
docker compose down -v
```

