# Quickstart 10 min (API + Web + DB)

Versión express para dejar el proyecto funcionando en una máquina nueva.

## 0) Requisitos

- Docker
- Node.js 20+

## 1) Preparar `.env`

Si no tienes `.env`, créalo desde `.env.example`:

```bash
cp .env.example .env
```

Asegúrate de que exista al menos:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/clubfutbolin"
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=clubfutbolin
DB_PORT=5432
```

## 2) Instalar dependencias

```bash
npm install
```

## 3) Levantar Postgres (Docker)

```bash
docker compose up -d
```

## 4) Migrar BD

```bash
npm run db:migrate
```

## 5) Cargar seed (datos iniciales)

```bash
npm run db:seed
```

Credenciales admin del seed:

- email: `admin@seed.local`
- password: `admin123456`

## 6) Levantar API (Fastify)

```bash
npm run dev:api
```

Abre:

- `http://localhost:3000/documentation` (Swagger UI; JSON en `/documentation/json`)

## 7) Levantar Web (React/Vite)

En otra terminal:

```bash
npm run dev:web
```

## 8) Parar todo al terminar

```bash
docker compose down
```

