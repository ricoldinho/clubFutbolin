"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playersRoutes = playersRoutes;
const zod_1 = require("zod");
const GetPlayerById_use_case_1 = require("@/application/use-cases/players/GetPlayerById.use-case");
const ListPlayers_use_case_1 = require("@/application/use-cases/players/ListPlayers.use-case");
const RegisterPlayer_use_case_1 = require("@/application/use-cases/players/RegisterPlayer.use-case");
const DeletePlayer_use_case_1 = require("@/application/use-cases/players/DeletePlayer.use-case");
const UpdatePlayer_use_case_1 = require("@/application/use-cases/players/UpdatePlayer.use-case");
const PlayerId_value_object_1 = require("@/domain/players/value-objects/PlayerId.value-object");
const PlayerRole_1 = require("@/domain/players/PlayerRole");
const Email_value_object_1 = require("@/domain/players/value-objects/Email.value-object");
const PhoneNumber_value_object_1 = require("@/domain/players/value-objects/PhoneNumber.value-object");
const Birthdate_value_object_1 = require("@/domain/players/value-objects/Birthdate.value-object");
const PlayerCategory_1 = require("@/domain/players/PlayerCategory");
const http_error_mapper_1 = require("@/adapters/http/http-error-mapper");
const auth_plugin_1 = require("@/adapters/http/auth/auth-plugin");
const schemas_1 = require("./schemas");
const pagination_1 = require("@/shared/pagination");
const http_response_schemas_1 = require("@/adapters/http/http-response-schemas");
function toPlayerResponse(player) {
    return {
        id: player.id?.value ?? null,
        name: player.name,
        lastname: player.lastname,
        nickname: player.nickname,
        email: player.email.value,
        phoneNumber: player.phoneNumber.value,
        birthdate: player.birthdate.value.toISOString().slice(0, 10),
        category: player.category,
        role: player.role,
    };
}
/**
 * Registra las rutas HTTP relacionadas con Player.
 *
 * Endpoints:
 * - GET    /players             → Listar Players paginados (query opcional: page, limit)
 * - GET    /players/:playerId   → Obtener un Player por id
 * - GET    /players/:playerId/memberships → Obtener ligas/equipos en los que participa un Player
 * - POST   /players             → Registrar un nuevo Player
 * - PATCH  /players/:playerId   → Actualizar datos de un Player existente
 * - DELETE /players/:playerId   → Eliminar un Player
 */
async function playersRoutes(server, options = {}) {
    const zodServer = server.withTypeProvider();
    const requireAuth = (0, auth_plugin_1.createRequireAuth)(options.jwtService ?? server.container.cradle.jwtService);
    const resolveGetPlayerById = (request) => options.getPlayerById ??
        (options.repository
            ? new GetPlayerById_use_case_1.GetPlayerById(options.repository)
            : request.container.cradle.getPlayerById);
    const resolveListPlayers = (request) => options.listPlayers ??
        (options.repository
            ? new ListPlayers_use_case_1.ListPlayers(options.repository)
            : request.container.cradle.listPlayers);
    const resolveRegisterPlayer = (request) => options.registerPlayer ??
        (options.repository && options.passwordHasher
            ? new RegisterPlayer_use_case_1.RegisterPlayer(options.repository, options.passwordHasher)
            : request.container.cradle.registerPlayer);
    const resolveDeletePlayer = (request) => options.deletePlayer ??
        (options.repository
            ? new DeletePlayer_use_case_1.DeletePlayer(options.repository)
            : request.container.cradle.deletePlayer);
    const resolveUpdatePlayer = (request) => options.updatePlayer ??
        (options.repository
            ? new UpdatePlayer_use_case_1.UpdatePlayer(options.repository)
            : request.container.cradle.updatePlayer);
    /**
     * POST /players
     *
     * Registra un nuevo Player.
     * - 201: Player creado
     * - 400: datos de entrada inválidos (Zod o Value Objects)
     * - 409: email ya en uso
     */
    zodServer.post('/players', {
        schema: {
            body: schemas_1.registerPlayerBodySchema,
            response: {
                201: schemas_1.playerResponseSchema,
                400: http_response_schemas_1.httpErrorResponseSchema,
                409: http_response_schemas_1.httpErrorResponseSchema,
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['players'],
            summary: 'Registrar player',
        },
    }, async (request, reply) => {
        try {
            const registerPlayer = resolveRegisterPlayer(request);
            const body = request.body;
            const result = await registerPlayer.execute({
                name: body.name,
                lastname: body.lastname,
                nickname: body.nickname ?? null,
                email: Email_value_object_1.Email.create(body.email),
                phoneNumber: PhoneNumber_value_object_1.PhoneNumber.create(body.phoneNumber),
                birthdate: Birthdate_value_object_1.Birthdate.create(body.birthdate),
                category: (0, PlayerCategory_1.parsePlayerCategory)(body.category),
                password: body.password,
            });
            if (!result.ok) {
                const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(result.error);
                if (statusCode === 409) {
                    request.log.info({ err: result.error }, 'Email ya en uso al registrar Player');
                }
                else {
                    request.log.warn({ err: result.error }, 'Error de dominio al registrar Player');
                }
                return reply
                    .code(statusCode)
                    .send({ message });
            }
            return reply.code(201).send(toPlayerResponse(result.value));
        }
        catch (error) {
            const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(error);
            if (statusCode >= 500) {
                request.log.error({ err: error }, 'Error inesperado registrando Player');
            }
            else {
                request.log.warn({ err: error }, 'Error de dominio al registrar Player');
            }
            return reply
                .code(statusCode)
                .send({ message });
        }
    });
    /**
     * GET /players/:playerId
     *
     * Obtiene un Player por identificador. Requiere autenticación; solo el propio Player o ADMIN.
     * - 200: Player encontrado
     * - 401: sin token o token inválido
     * - 403: sin permiso para ver este jugador
     * - 404: Player no encontrado
     */
    zodServer.get('/players/:playerId', {
        preHandler: [requireAuth],
        schema: {
            params: schemas_1.getPlayerByIdParamsSchema,
            response: {
                200: schemas_1.playerResponseSchema,
                400: http_response_schemas_1.httpErrorResponseSchema,
                401: http_response_schemas_1.httpErrorResponseSchema,
                403: http_response_schemas_1.httpErrorResponseSchema,
                404: http_response_schemas_1.httpErrorResponseSchema,
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['players'],
            summary: 'Obtener player por id',
            security: [{ bearerAuth: [] }],
        },
    }, async (request, reply) => {
        try {
            const getPlayerById = resolveGetPlayerById(request);
            const { playerId: rawId } = request.params;
            const playerId = PlayerId_value_object_1.PlayerId.fromString(rawId);
            const actor = {
                id: PlayerId_value_object_1.PlayerId.fromString(request.user.playerId),
                role: (0, PlayerRole_1.parsePlayerRole)(request.user.role),
            };
            const result = await getPlayerById.execute(playerId, actor);
            if (!result.ok) {
                const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(result.error);
                request.log.warn({ err: result.error }, 'Player no encontrado o sin permiso');
                return reply
                    .code(statusCode)
                    .send({ message });
            }
            return reply.code(200).send(toPlayerResponse(result.value));
        }
        catch (error) {
            const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(error);
            if (statusCode >= 500) {
                request.log.error({ err: error }, 'Error inesperado obteniendo Player por id');
            }
            else {
                request.log.warn({ err: error }, 'Error de dominio en GET /players/:playerId');
            }
            return reply
                .code(statusCode)
                .send({ message });
        }
    });
    /**
     * GET /players/:playerId/memberships
     *
     * Obtiene las membresías del jugador (equipos, temporadas y ligas).
     * Requiere autenticación; solo el propio Player o ADMIN.
     * - 200: listado (posiblemente vacío)
     * - 401: sin token o token inválido
     * - 403: sin permiso para ver este jugador
     * - 400: playerId inválido
     */
    zodServer.get('/players/:playerId/memberships', {
        preHandler: [requireAuth],
        schema: {
            params: schemas_1.getPlayerByIdParamsSchema,
            response: {
                200: schemas_1.playerMembershipsResponseSchema,
                400: http_response_schemas_1.httpErrorResponseSchema,
                401: http_response_schemas_1.httpErrorResponseSchema,
                403: http_response_schemas_1.httpErrorResponseSchema,
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['players'],
            summary: 'Obtener membresías de player',
            security: [{ bearerAuth: [] }],
        },
    }, async (request, reply) => {
        try {
            const { playerId: rawId } = request.params;
            const playerId = PlayerId_value_object_1.PlayerId.fromString(rawId);
            const actorId = PlayerId_value_object_1.PlayerId.fromString(request.user.playerId);
            const actorRole = (0, PlayerRole_1.parsePlayerRole)(request.user.role);
            if (!actorId.equals(playerId) && actorRole !== 'ADMIN') {
                return reply.code(403).send({ message: 'No tienes permisos para este recurso' });
            }
            const rosterRepository = options.rosterRepository ?? request.container.cradle.rosterRepository;
            const memberships = await rosterRepository.findMembershipsByPlayerId(playerId);
            return reply.code(200).send({
                data: memberships.map((membership) => ({
                    teamSeasonId: membership.teamSeasonId.value,
                    team: {
                        id: membership.teamId.value,
                        name: membership.teamName,
                    },
                    season: {
                        id: membership.seasonId.value,
                        year: membership.seasonYear,
                    },
                    league: {
                        id: membership.leagueId,
                        name: membership.leagueName,
                    },
                })),
            });
        }
        catch (error) {
            const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(error);
            if (statusCode >= 500) {
                request.log.error({ err: error }, 'Error inesperado obteniendo membresías de Player');
            }
            else {
                request.log.warn({ err: error }, 'Error de dominio en GET /players/:playerId/memberships');
            }
            return reply
                .code(statusCode)
                .send({ message });
        }
    });
    /**
     * DELETE /players/:playerId
     *
     * Elimina un Player. Requiere autenticación; solo el propio Player o ADMIN.
     * - 204: Player eliminado
     * - 401: sin token o token inválido
     * - 403: sin permiso
     * - 404: Player no encontrado
     */
    zodServer.delete('/players/:playerId', {
        preHandler: [requireAuth],
        schema: {
            params: schemas_1.getPlayerByIdParamsSchema,
            response: {
                204: zod_1.z.any(),
                400: http_response_schemas_1.httpErrorResponseSchema,
                401: http_response_schemas_1.httpErrorResponseSchema,
                403: http_response_schemas_1.httpErrorResponseSchema,
                404: http_response_schemas_1.httpErrorResponseSchema,
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['players'],
            summary: 'Eliminar player',
            security: [{ bearerAuth: [] }],
        },
    }, async (request, reply) => {
        try {
            const deletePlayer = resolveDeletePlayer(request);
            const { playerId: rawId } = request.params;
            const playerId = PlayerId_value_object_1.PlayerId.fromString(rawId);
            const actor = {
                id: PlayerId_value_object_1.PlayerId.fromString(request.user.playerId),
                role: (0, PlayerRole_1.parsePlayerRole)(request.user.role),
            };
            const result = await deletePlayer.execute(playerId, actor);
            if (!result.ok) {
                const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(result.error);
                request.log.warn({ err: result.error }, 'Player no encontrado o sin permiso al eliminar');
                return reply
                    .code(statusCode)
                    .send({ message });
            }
            return reply.code(204).send();
        }
        catch (error) {
            const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(error);
            if (statusCode >= 500) {
                request.log.error({ err: error }, 'Error inesperado eliminando Player por id');
            }
            else {
                request.log.warn({ err: error }, 'Error de dominio en DELETE /players/:playerId');
            }
            return reply
                .code(statusCode)
                .send({ message });
        }
    });
    /**
     * PATCH /players/:playerId
     *
     * Actualiza los datos de un Player. Requiere autenticación.
     * Solo un ADMIN puede asignar role ADMIN a otro.
     * - 200: Player actualizado
     * - 401: sin token o token inválido
     * - 403: sin permiso (ej. USER intentando asignar ADMIN)
     * - 404: Player no encontrado
     * - 409: email ya en uso
     */
    zodServer.patch('/players/:playerId', {
        preHandler: [requireAuth],
        schema: {
            params: schemas_1.getPlayerByIdParamsSchema,
            body: schemas_1.updatePlayerBodySchema,
            response: {
                200: schemas_1.playerResponseSchema,
                400: http_response_schemas_1.httpErrorResponseSchema,
                401: http_response_schemas_1.httpErrorResponseSchema,
                403: http_response_schemas_1.httpErrorResponseSchema,
                404: http_response_schemas_1.httpErrorResponseSchema,
                409: http_response_schemas_1.httpErrorResponseSchema,
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['players'],
            summary: 'Actualizar player',
            security: [{ bearerAuth: [] }],
        },
    }, async (request, reply) => {
        try {
            const updatePlayer = resolveUpdatePlayer(request);
            const { playerId: rawId } = request.params;
            const body = request.body;
            const playerId = PlayerId_value_object_1.PlayerId.fromString(rawId);
            const actor = {
                id: PlayerId_value_object_1.PlayerId.fromString(request.user.playerId),
                role: (0, PlayerRole_1.parsePlayerRole)(request.user.role),
            };
            const input = {
                id: playerId,
                actor,
                name: body.name,
                lastname: body.lastname,
                nickname: body.nickname,
                email: body.email ? Email_value_object_1.Email.create(body.email) : undefined,
                phoneNumber: body.phoneNumber
                    ? PhoneNumber_value_object_1.PhoneNumber.create(body.phoneNumber)
                    : undefined,
                birthdate: body.birthdate
                    ? Birthdate_value_object_1.Birthdate.create(body.birthdate)
                    : undefined,
                category: body.category
                    ? (0, PlayerCategory_1.parsePlayerCategory)(body.category)
                    : undefined,
                role: body.role ? (0, PlayerRole_1.parsePlayerRole)(body.role) : undefined,
            };
            const result = await updatePlayer.execute(input);
            if (!result.ok) {
                const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(result.error);
                if (statusCode === 409) {
                    request.log.info({ err: result.error }, 'Email ya en uso al actualizar Player');
                }
                else {
                    request.log.warn({ err: result.error }, 'Error de dominio al actualizar Player');
                }
                return reply
                    .code(statusCode)
                    .send({ message });
            }
            return reply.code(200).send(toPlayerResponse(result.value));
        }
        catch (error) {
            const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(error);
            if (statusCode >= 500) {
                request.log.error({ err: error }, 'Error inesperado actualizando Player');
            }
            else {
                request.log.warn({ err: error }, 'Error de dominio en PATCH /players/:playerId');
            }
            return reply
                .code(statusCode)
                .send({ message });
        }
    });
    /**
     * GET /players
     *
     * Lista Players. Requiere autenticación (cualquier role).
     * Query opcional: `page`, `limit` (máx. 100), `q` (búsqueda en nombre, apellidos o alias, máx. 100 caracteres).
     * Si no se envían page/limit, usa defaults page=1, limit=20.
     * - 200: objeto paginado con lista (posiblemente vacía)
     * - 400: query inválida (page/limit/q)
     * - 401: sin token o token inválido
     */
    zodServer.get('/players', {
        preHandler: [requireAuth],
        schema: {
            querystring: schemas_1.listPlayersQuerySchema,
            response: {
                200: schemas_1.listPlayersResponseSchema,
                400: http_response_schemas_1.httpErrorResponseSchema,
                401: http_response_schemas_1.httpErrorResponseSchema,
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['players'],
            summary: 'Listar players paginados',
            description: 'Lista paginada. El parámetro opcional `q` filtra por coincidencia parcial en nombre, apellidos o alias (sin distinguir mayúsculas).',
            security: [{ bearerAuth: [] }],
        },
    }, async (request, reply) => {
        try {
            const listPlayers = resolveListPlayers(request);
            const query = request.query;
            const result = await listPlayers.execute({
                pagination: { page: query.page, limit: query.limit },
                searchQuery: query.q,
            });
            if (!result.ok) {
                const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(result.error);
                return reply
                    .code(statusCode)
                    .send({ message });
            }
            const response = {
                data: result.value.data.map(toPlayerResponse),
                meta: {
                    total: result.value.total,
                    page: query.page,
                    lastPage: (0, pagination_1.computeLastPage)(result.value.total, query.limit),
                },
            };
            return reply.code(200).send(response);
        }
        catch (error) {
            const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(error);
            if (statusCode >= 500) {
                request.log.error({ err: error }, 'Error inesperado listando Players');
            }
            return reply
                .code(statusCode)
                .send({ message });
        }
    });
}
