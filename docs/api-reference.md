### clubFutbolin – Referencia de API HTTP

Esta referencia describe los endpoints HTTP expuestos actualmente por el backend de `clubFutbolin`.

- **Base URL local (desarrollo)**: `http://localhost:<PORT>`
  - `<PORT>` viene de la configuración de entorno (`PORT` cargado por `fastify-env`).
- **Formato**: JSON sobre HTTP.
- **Autenticación**:
  - `POST /players` y `POST /auth/login` son públicos.
  - El resto de endpoints requieren JWT en el header:
    - `Authorization: Bearer <token>`

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
      "expiresIn": 3600
    }
    ```
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
    "nickname": "Manu",              // opcional, puede ser null
    "email": "manu@example.com",
    "phoneNumber": "+34123456789",
    "league": ["Liga1", "Liga2"],    // opcional, por defecto []
    "birthdate": "1990-01-01",       // string, idealmente yyyy-mm-dd
    "category": "PRIMERA",           // CUARTA|TERCERA|SEGUNDA|PRIMERA|ELITE
    "password": "password-segura"    // min 8 caracteres
  }
  ```
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
      "league": ["Liga1", "Liga2"],
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
  - `playerId`: UUID v4 (string).
    - Ejemplo: `/players/550e8400-e29b-41d4-a716-446655440000`
- **Query params**: Ninguno.
- **Body (request)**: No aplica.
- **Respuestas**:
  - `200 OK`:
    ```json
    {
      "id": "uuid",
      "name": "Manuel",
      "lastname": "Rico",
      "nickname": "Manu",
      "email": "manu@example.com",
      "phoneNumber": "+34123456789",
      "league": ["Liga1", "Liga2"],
      "birthdate": "1990-01-01",
      "category": "PRIMERA",
      "role": "USER"
    }
    ```
  - `400 Bad Request`:
    - `playerId` no es un UUID válido.
  - `401 Unauthorized`:
    - Sin token o token inválido.
  - `403 Forbidden`:
    - Token válido pero sin permiso (ej. otro usuario no ADMIN).
  - `404 Not Found`:
    - Jugador no existe.
  - `5xx`:
    - Error inesperado.

---

#### 3.3. Listar jugadores

##### `GET /players`

- **Descripción**: Devuelve una lista (posiblemente vacía) de jugadores.
- **Auth**:
  - Requiere `Authorization: Bearer <token>` (cualquier role).
- **Query params**:
  - Actualmente el endpoint acepta (vía `listPlayersQuerySchema`) pero todavía no utiliza:
    - `page` (opcional): entero positivo.
    - `pageSize` (opcional): entero positivo, máximo 100.
- **Body (request)**: No aplica.
- **Respuestas**:
  - `200 OK`:
    ```json
    [
      {
        "id": "uuid-1",
        "name": "Manuel",
        "lastname": "Rico",
        "nickname": "Manu",
        "email": "manu@example.com",
        "phoneNumber": "+34123456789",
        "league": ["Liga1", "Liga2"],
        "birthdate": "1990-01-01",
        "category": "PRIMERA",
        "role": "USER"
      },
      {
        "id": "uuid-2",
        "name": "Otra",
        "lastname": "Persona",
        "nickname": null,
        "email": "otra@example.com",
        "phoneNumber": "+34987654321",
        "league": [],
        "birthdate": "1992-05-10",
        "category": "SEGUNDA",
        "role": "ADMIN"
      }
    ]
    ```
  - `401 Unauthorized`:
    - Sin token o token inválido.
  - `5xx`:
    - Error inesperado.

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
    "name": "Nuevo nombre",              // opcional
    "lastname": "Nuevo apellido",        // opcional
    "nickname": "Nuevo nick",           // opcional, puede ser null
    "email": "nuevo@example.com",       // opcional
    "phoneNumber": "+34111111111",      // opcional
    "league": ["Liga1", "Liga3"],       // opcional
    "birthdate": "1991-02-03",          // opcional
    "category": "ELITE",                // opcional
    "role": "ADMIN"                     // opcional, solo ADMIN puede hacerlo
  }
  ```

  - Ejemplo mínimo válido:
  ```json
  {
    "nickname": null
  }
  ```

  - Validado por `updatePlayerBodySchema`:
    - Email con formato válido.
    - `phoneNumber` entre 9 y 20 caracteres.
    - `category` en `CUARTA|TERCERA|SEGUNDA|PRIMERA|ELITE`.
    - `role` en `USER|ADMIN`.
    - Body no vacío (`Debe enviarse al menos un campo para actualizar`).

- **Respuestas**:
  - `200 OK`:
    ```json
    {
      "id": "uuid",
      "name": "Actualizado",
      "lastname": "Rico",
      "nickname": "Nuevo nick",
      "email": "manu@example.com",
      "phoneNumber": "+34123456789",
      "league": ["Liga1", "Liga3"],
      "birthdate": "1990-01-01",
      "category": "ELITE",
      "role": "USER"
    }
    ```
  - `400 Bad Request`:
    - Body vacío (`{}`).
    - Campos con formato inválido (email, phoneNumber, etc.).
  - `401 Unauthorized`:
    - Sin token o token inválido.
  - `403 Forbidden`:
    - Sin permiso (por ejemplo, USER que intenta asignar `ADMIN`).
  - `404 Not Found`:
    - Jugador no existe.
  - `409 Conflict`:
    - Intentar actualizar el email a uno ya usado por otro jugador.
  - `5xx`:
    - Error inesperado.

---

#### 3.5. Eliminar un jugador

##### `DELETE /players/:playerId`

- **Descripción**: Elimina un jugador.
- **Auth**:
  - Requiere `Authorization: Bearer <token>`.
  - Solo el propio jugador o un `ADMIN` puede eliminar.
- **Params (path)**:
  - `playerId`: UUID.
- **Body (request)**: No aplica.
- **Respuestas**:
  - `204 No Content`:
    - Jugador eliminado con éxito.
  - `400 Bad Request`:
    - `playerId` no es UUID válido.
  - `401 Unauthorized`:
    - Sin token o token inválido.
  - `403 Forbidden`:
    - Sin permiso.
  - `404 Not Found`:
    - Jugador no existe.
  - `5xx`:
    - Error inesperado o de infraestructura.

---

### 4. Notas para nuevos endpoints

Al añadir un nuevo endpoint HTTP:

- Define el schema Zod del body/params/query en el fichero `schemas.ts` del recurso correspondiente.
- Añade el handler en `*.routes.ts` usando Fastify + Zod, siguiendo el patrón actual:
  - Validación con Zod **antes** de tocar el dominio.
  - Conversión a Value Objects en el handler.
  - Llamada al caso de uso, que devuelve `Result<T, E>`.
  - `mapDomainErrorToHttp` para traducir errores de dominio a HTTP.
- Actualiza:
  - Este fichero `docs/api-reference.md` con:
    - Endpoint, auth, params, body y respuestas esperadas.
    - Ejemplos de request/response.
  - Los tests:
    - Unitarios de schema (`*.schemas.test.ts`).
    - HTTP con `server.inject()` (`*.routes.test.ts`).

