### clubFutbolin – Referencia de API HTTP

Esta referencia describe los endpoints HTTP expuestos actualmente por el backend de `clubFutbolin`.

- **Base URL local (desarrollo)**: `http://localhost:<PORT>`
  - `<PORT>` viene de la configuración de entorno (`PORT` cargado por `fastify-env`).
- **Formato**: JSON sobre HTTP.
- **Autenticación**:
  - **Públicos** (sin JWT): `GET /`, `POST /auth/login`, `POST /players`, `GET /leagues`, `GET /leagues/:leagueId`, `GET /teams`, `GET /teams/by-name/:name`, `GET /seasons`, `GET /seasons/:seasonId`.
  - **JWT** (`Authorization: Bearer <token>`):
    - **Recurso Player**: `GET /players`, `GET /players/:playerId`, `PATCH /players/:playerId`, `DELETE /players/:playerId` (reglas: propio jugador o `ADMIN`; solo `ADMIN` puede asignar `role: ADMIN`).
    - **Leagues, Teams, Seasons, Rosters**: mutaciones (POST, PATCH, DELETE) requieren JWT con **role `ADMIN`** (`createRequireAdmin`).

> **Regla de mantenimiento**
>
> Cada vez que se añada, modifique o elimine un endpoint HTTP:
> - Actualiza este fichero (`docs/api-reference.md`) en el mismo PR.
> - Añade ejemplos de request/response cuando cambie el contrato.

---

### 1. Healthcheck

#### `GET /`

- **Descripción**: Comprueba que el servidor está levantado.
- **Auth**: No requiere.
- **Headers**: Ninguno especial.
- **Query params**: Ninguno.
- **Body (request)**: No aplica.
- **Respuestas**:
  - `200 OK`:
    ```json
    {
      "status": "OK",
      "env": "development"
    }
    ```

---

### 2. Autenticación

#### `POST /auth/login`

- **Descripción**: Login de un jugador ya registrado. Devuelve un JWT.
- **Auth**: No requiere (es el endpoint de login).
- **Headers**:
  - `Content-Type: application/json`
- **Body (request)**:
  ```json
  {
    "email": "user@example.com",
    "password": "supersecret"
  }
  ```
  - Validado por `loginBodySchema` (`email`, `password` obligatorios).
- **Respuestas**:
  - `200 OK`:
    ```json
    {
      "token": "<jwt-token>",
      "expiresIn": "1h"
    }
    ```
    - `expiresIn` es el valor configurado en `JWT_EXPIRES_IN` (string, ej. `1h`, `3600s`).
  - `400 Bad Request`:
    - Body no cumple el schema (email inválido, password vacía, etc.).
  - `401 Unauthorized`:
    - Credenciales inválidas (mapeo de error de dominio).
  - `5xx`:
    - Error inesperado o de infraestructura.

---

### 3. Recurso `Player`

Todos los endpoints de `Player` usan como prefijo `/players`.

#### 3.1. Registrar un jugador

##### `POST /players`

- **Descripción**: Registra un nuevo jugador con role inicial `USER`.
- **Auth**: No requiere.
- **Headers**:
  - `Content-Type: application/json`
- **Body (request)**:
  ```json
  {
    "name": "Manuel",
    "lastname": "Rico",
    "nickname": "Manu",
    "email": "manu@example.com",
    "phoneNumber": "+34123456789",
    "birthdate": "1990-01-01",
    "category": "PRIMERA",
    "password": "password-segura"
  }
  ```
  - `nickname`: opcional, puede ser `null`.
  - `category`: `CUARTA` | `TERCERA` | `SEGUNDA` | `PRIMERA` | `ELITE`.
  - Validado por `registerPlayerBodySchema`.
- **Respuestas**:
  - `201 Created`:
    ```json
    {
      "id": "uuid",
      "name": "Manuel",
      "lastname": "Rico",
      "nickname": "Manu",
      "email": "manu@example.com",
      "phoneNumber": "+34123456789",
      "birthdate": "1990-01-01",
      "category": "PRIMERA",
      "role": "USER"
    }
    ```
  - `400 Bad Request`:
    - Body no cumple el schema de Zod.
    - O errores de Value Objects (email, phoneNumber, birthdate, category).
  - `409 Conflict`:
    - Email ya en uso.
  - `5xx`:
    - Error inesperado o de infraestructura.

---

#### 3.2. Obtener un jugador por id

##### `GET /players/:playerId`

- **Descripción**: Devuelve la información de un jugador por id.
- **Auth**:
  - Requiere `Authorization: Bearer <token>`.
  - Solo el propio jugador o un `ADMIN` puede acceder.
- **Params (path)**:
  - `playerId`: UUID (string).
- **Query params**: Ninguno.
- **Body (request)**: No aplica.
- **Respuestas**:
  - `200 OK`: mismo shape que en registro (sin `password`).
  - `400 Bad Request`: `playerId` no es un UUID válido.
  - `401 Unauthorized`: sin token o token inválido.
  - `403 Forbidden`: token válido pero sin permiso.
  - `404 Not Found`: jugador no existe.
  - `5xx`: error inesperado.

---

#### 3.3. Listar jugadores

##### `GET /players`

- **Descripción**: Devuelve una lista (posiblemente vacía) de jugadores.
- **Auth**: Requiere `Authorization: Bearer <token>` (cualquier role).
- **Query params**:
  - Aceptados por schema pero aún no aplicados en el caso de uso: `page`, `pageSize` (opcionales).
- **Body (request)**: No aplica.
- **Respuestas**:
  - `200 OK`: array de jugadores (mismo shape que GET por id).
  - `401 Unauthorized`: sin token o token inválido.
  - `5xx`: error inesperado.

---

#### 3.4. Actualizar parcialmente un jugador

##### `PATCH /players/:playerId`

- **Descripción**: Actualiza uno o varios campos de un jugador.
- **Auth**:
  - Requiere `Authorization: Bearer <token>`.
  - Solo el propio jugador o un `ADMIN` puede modificar.
  - Solo un `ADMIN` puede asignar role `ADMIN` a otro jugador.
- **Params (path)**:
  - `playerId`: UUID.
- **Body (request)**:
  - Todos los campos son opcionales, pero debe venir al menos uno:
  ```json
  {
    "name": "Nuevo nombre",
    "lastname": "Nuevo apellido",
    "nickname": "Nuevo nick",
    "email": "nuevo@example.com",
    "phoneNumber": "+34111111111",
    "birthdate": "1991-02-03",
    "category": "ELITE",
    "role": "ADMIN"
  }
  ```
  - Validado por `updatePlayerBodySchema` (body no vacío, formatos coherentes).
- **Respuestas**:
  - `200 OK`: jugador actualizado.
  - `400 Bad Request`: body vacío o campos inválidos.
  - `401 Unauthorized` / `403 Forbidden` / `404 Not Found` / `409 Conflict` (email duplicado) / `5xx`.

---

#### 3.5. Eliminar un jugador

##### `DELETE /players/:playerId`

- **Descripción**: Elimina un jugador.
- **Auth**: JWT; solo el propio jugador o `ADMIN`.
- **Params (path)**: `playerId` UUID.
- **Respuestas**:
  - `204 No Content`: eliminado.
  - `400` / `401` / `403` / `404` / `5xx` según corresponda.

---

### 4. Recurso `League`

Prefijo `/leagues`. Listado y lectura son **públicos**; crear, actualizar y borrar requieren **JWT de ADMIN**.

#### `POST /leagues`

- **Auth**: `Authorization: Bearer <token>` con role `ADMIN`.
- **Body**:
  ```json
  {
    "name": "Liga Provincial",
    "leagueCategory": "PRIMERA"
  }
  ```
  - `leagueCategory`: `ELITE` | `PRO` | `AVANZADO` | `MASTER` | `PRIMERA` | `SEGUNDA` | `TERCERA` | `CUARTA`.
- **Respuestas**: `201` con `{ "id", "name", "leagueCategory" }`; `400`; `401`; `403`; `409` (nombre duplicado); `5xx`.

#### `GET /leagues`

- **Auth**: No.
- **Respuestas**: `200` array de `{ "id", "name", "leagueCategory" }`.

#### `GET /leagues/:leagueId`

- **Auth**: No.
- **Params**: `leagueId` UUID.
- **Respuestas**: `200`; `400` (UUID inválido); `404`; `5xx`.

#### `PATCH /leagues/:leagueId`

- **Auth**: ADMIN.
- **Body** (al menos un campo):
  ```json
  {
    "name": "Nuevo nombre",
    "leagueCategory": "ELITE"
  }
  ```
- **Respuestas**: `200`; `400`; `401`; `403`; `404`; `409` (nombre duplicado respecto a otra liga); `5xx`.

#### `DELETE /leagues/:leagueId`

- **Auth**: ADMIN.
- **Respuestas**: `204`; `401`; `403`; `404`; `5xx`.

---

### 5. Recurso `Team`

Prefijo `/teams`. Listado y búsqueda por nombre son **públicos**; crear, actualizar y borrar requieren **ADMIN**.

#### `POST /teams`

- **Auth**: ADMIN.
- **Body**:
  ```json
  { "name": "Equipo Alpha" }
  ```
- **Respuestas**: `201` con `{ "id", "name", "createdAt" }` (ISO 8601); `409` nombre duplicado; `401`; `403`; `5xx`.

#### `GET /teams`

- **Auth**: No.
- **Respuestas**: `200` array de equipos.

#### `GET /teams/by-name/:name`

- **Auth**: No.
- **Params**: `name` en path (URL-encoded si hace falta).
- **Respuestas**: `200` un equipo; `404` si no existe.

#### `PATCH /teams/:teamId`

- **Auth**: ADMIN.
- **Body** (al menos `name`):
  ```json
  { "name": "Nuevo nombre" }
  ```
- **Respuestas**: `200`; `404`; `409` si el nombre ya lo usa otro equipo; `401`; `403`; `5xx`.

#### `DELETE /teams/:teamId`

- **Auth**: ADMIN.
- **Respuestas**: `204`; `404`; `401`; `403`; `5xx`.

---

### 6. Recurso `Season`

Prefijo `/seasons`. Listado y lectura son **públicos**; crear temporada y asignar ganadores requieren **ADMIN**.

#### `POST /seasons`

- **Auth**: ADMIN.
- **Body**:
  ```json
  {
    "year": 2025,
    "leagueId": "uuid-de-la-liga"
  }
  ```
  - `year`: entero entre 2000 y 2100.
- **Respuestas**:
  - `201` con `{ "id", "year", "leagueId", "championId", "secondId" }` (últimos dos pueden ser `null`).
  - `404` si la liga no existe.
  - `409` si ya existe una temporada con el mismo año en esa liga.

#### `GET /seasons`

- **Auth**: No.
- **Respuestas**: `200` array de temporadas.

#### `GET /seasons/:seasonId`

- **Auth**: No.
- **Params**: `seasonId` UUID.
- **Respuestas**: `200`; `404`; `400`.

#### `PATCH /seasons/:seasonId/winners`

- **Auth**: ADMIN.
- **Body**:
  ```json
  {
    "championId": "uuid-equipo-campeon",
    "secondId": "uuid-equipo-subcampeon"
  }
  ```
  - Deben ser equipos distintos.
- **Respuestas**: `200` temporada actualizada; `400` si campeón y subcampeón son el mismo; `404` temporada o equipo no encontrado; `401`; `403`; `5xx`.

---

### 7. Recurso `Roster` (plantillas por equipo-temporada)

Prefijo `/rosters`. Todas las rutas requieren **JWT de ADMIN**.

Los identificadores `teamSeasonId` y `playerId` son UUID.

#### `POST /rosters/register`

- **Descripción**: Inscribe un equipo en una temporada (crea un `TeamSeason` / plantilla vacía).
- **Body**:
  ```json
  {
    "teamId": "uuid",
    "seasonId": "uuid"
  }
  ```
- **Respuestas**:
  - `201` con `{ "teamSeasonId", "teamId", "seasonId", "membersCount" }` (`membersCount` suele ser 0).
  - `404` equipo o temporada no encontrados.
  - `409` si el equipo ya está inscrito en esa temporada.

#### `POST /rosters/:teamSeasonId/players`

- **Descripción**: Añade un jugador a la plantilla (máximo 4 jugadores, sin duplicados).
- **Body**:
  ```json
  {
    "playerId": "uuid",
    "position": "PORTERO"
  }
  ```
  - `position`: `PORTERO` | `DELANTERO`.
- **Respuestas**: `200` con `{ "membersCount" }`; `400` reglas de dominio (plantilla llena, duplicado); `404` roster no encontrado; `401`; `403`; `5xx`.

#### `DELETE /rosters/:teamSeasonId/players/:playerId`

- **Descripción**: Quita un jugador de la plantilla.
- **Respuestas**: `200` con `{ "membersCount" }`; `400` si el jugador no está en la plantilla; `404`; `401`; `403`; `5xx`.

---

### 8. Notas para nuevos endpoints

Al añadir un nuevo endpoint HTTP:

- Define el schema Zod del body/params/query en el fichero `schemas.ts` del recurso correspondiente.
- Añade el handler en `*.routes.ts` usando Fastify + Zod, siguiendo el patrón actual:
  - Validación con Zod **antes** de tocar el dominio.
  - Conversión a Value Objects en el handler.
  - Llamada al caso de uso, que devuelve `Result<T, E>`.
  - `mapDomainErrorToHttp` para traducir errores de dominio a HTTP.
- Actualiza:
  - Este fichero `docs/api-reference.md` con endpoint, auth, params, body y respuestas.
  - `docs/api.http` con ejemplos ejecutables.
  - Tests: `*.schemas.test.ts` y `*.routes.test.ts`.
