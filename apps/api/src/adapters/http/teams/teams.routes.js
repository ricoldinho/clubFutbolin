"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teamsRoutes = teamsRoutes;
const zod_1 = require("zod");
const UpdateTeam_use_case_1 = require("@/application/use-cases/teams/UpdateTeam.use-case");
const DeleteTeam_use_case_1 = require("@/application/use-cases/teams/DeleteTeam.use-case");
const ListTeams_use_case_1 = require("@/application/use-cases/teams/ListTeams.use-case");
const GetTeamByName_use_case_1 = require("@/application/use-cases/teams/GetTeamByName.use-case");
const TeamId_value_object_1 = require("@/domain/teams/TeamId.value-object");
const http_error_mapper_1 = require("@/adapters/http/http-error-mapper");
const auth_plugin_1 = require("@/adapters/http/auth/auth-plugin");
const schemas_1 = require("./schemas");
const pagination_1 = require("@/shared/pagination");
const http_response_schemas_1 = require("@/adapters/http/http-response-schemas");
function toTeamResponse(team) {
    return {
        id: team.id?.value ?? null,
        name: team.name,
        createdAt: team.createdAt.toISOString(),
    };
}
async function teamsRoutes(server, options = {}) {
    const zodServer = server.withTypeProvider();
    const requireAdmin = (0, auth_plugin_1.createRequireAdmin)(options.jwtService ?? server.container.cradle.jwtService);
    const resolveCreateTeam = (request) => options.createTeam ?? request.container.cradle.createTeam;
    const resolveUpdateTeam = (request) => options.updateTeam ??
        (options.repository
            ? new UpdateTeam_use_case_1.UpdateTeam(options.repository)
            : request.container.cradle.updateTeam);
    const resolveDeleteTeam = (request) => options.deleteTeam ??
        (options.repository
            ? new DeleteTeam_use_case_1.DeleteTeam(options.repository)
            : request.container.cradle.deleteTeam);
    const resolveListTeams = (request) => options.listTeams ??
        (options.repository
            ? new ListTeams_use_case_1.ListTeams(options.repository)
            : request.container.cradle.listTeams);
    const resolveGetTeamByName = (request) => options.getTeamByName ??
        (options.repository
            ? new GetTeamByName_use_case_1.GetTeamByName(options.repository)
            : request.container.cradle.getTeamByName);
    const resolveRosterRepository = (request) => options.rosterRepository ?? request.container.cradle.rosterRepository;
    /**
     * POST /teams
     *
     * Crea un equipo e inscribe la plantilla inicial (2–4 jugadores) en la temporada
     * con el año más alto registrado en el sistema.
     * - 201: Equipo creado
     * - 400: Validación (p. ej. menos de 2 jugadores) o aún no hay temporadas
     * - 404: Algún `playerId` no existe
     * - 409: Nombre de equipo duplicado
     */
    zodServer.post('/teams', {
        preHandler: [requireAdmin],
        schema: {
            body: schemas_1.createTeamBodySchema,
            response: {
                201: schemas_1.teamResponseSchema,
                400: http_response_schemas_1.httpErrorResponseSchema,
                401: http_response_schemas_1.httpErrorResponseSchema,
                403: http_response_schemas_1.httpErrorResponseSchema,
                404: http_response_schemas_1.httpErrorResponseSchema,
                409: http_response_schemas_1.httpErrorResponseSchema,
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['teams'],
            summary: 'Crear equipo',
            security: [{ bearerAuth: [] }],
        },
    }, async (request, reply) => {
        try {
            const createTeam = resolveCreateTeam(request);
            const body = request.body;
            const result = await createTeam.execute({ name: body.name, playerIds: body.playerIds });
            if (!result.ok) {
                const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(result.error);
                return reply
                    .code(statusCode)
                    .send({ message });
            }
            return reply.code(201).send(toTeamResponse(result.value));
        }
        catch (error) {
            const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(error);
            return reply
                .code(statusCode)
                .send({ message });
        }
    });
    zodServer.get('/teams', {
        schema: {
            querystring: schemas_1.listTeamsQuerySchema,
            response: {
                200: schemas_1.listTeamsResponseSchema,
                400: http_response_schemas_1.httpErrorResponseSchema,
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['teams'],
            summary: 'Listar equipos paginados',
            description: 'Lista paginada. El parámetro opcional `q` filtra por coincidencia parcial en el nombre (sin distinguir mayúsculas).',
        },
    }, async (_request, reply) => {
        try {
            const listTeams = resolveListTeams(_request);
            const query = _request.query;
            const result = await listTeams.execute({
                pagination: { page: query.page, limit: query.limit },
                searchQuery: query.q,
            });
            if (!result.ok) {
                const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(result.error);
                return reply
                    .code(statusCode)
                    .send({ message });
            }
            return reply.code(200).send({
                data: result.value.data.map(toTeamResponse),
                meta: {
                    total: result.value.total,
                    page: query.page,
                    lastPage: (0, pagination_1.computeLastPage)(result.value.total, query.limit),
                },
            });
        }
        catch (error) {
            const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(error);
            return reply
                .code(statusCode)
                .send({ message });
        }
    });
    /**
     * GET /teams/:teamId/profile
     *
     * Devuelve información del equipo, ligas/temporadas en las que participa
     * y jugadores que lo integran.
     */
    zodServer.get('/teams/:teamId/profile', {
        schema: {
            params: schemas_1.getTeamByIdParamsSchema,
            response: {
                200: schemas_1.teamProfileResponseSchema,
                400: http_response_schemas_1.httpErrorResponseSchema,
                404: http_response_schemas_1.httpErrorResponseSchema,
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['teams'],
            summary: 'Obtener perfil de equipo',
        },
    }, async (request, reply) => {
        try {
            const teamId = TeamId_value_object_1.TeamId.fromString(request.params.teamId);
            const teamRepository = options.repository ?? request.container.cradle.teamRepository;
            const team = await teamRepository.findById(teamId);
            if (team === null) {
                return reply.code(404).send({ message: `Team with id "${teamId.value}" not found` });
            }
            const rosterRepository = resolveRosterRepository(request);
            const [memberships, players] = await Promise.all([
                rosterRepository.findMembershipsByTeamId(teamId),
                rosterRepository.findPlayersByTeamId(teamId),
            ]);
            return reply.code(200).send({
                team: toTeamResponse(team),
                leagues: memberships.map((membership) => ({
                    id: membership.leagueId,
                    name: membership.leagueName,
                    leagueCategory: membership.leagueCategory,
                    seasonId: membership.seasonId.value,
                    seasonYear: membership.seasonYear,
                })),
                players,
            });
        }
        catch (error) {
            const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(error);
            return reply.code(statusCode).send({ message });
        }
    });
    zodServer.get('/teams/by-name/:name', {
        schema: {
            params: schemas_1.getTeamByNameParamsSchema,
            response: {
                200: schemas_1.teamResponseSchema,
                400: http_response_schemas_1.httpErrorResponseSchema,
                404: http_response_schemas_1.httpErrorResponseSchema,
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['teams'],
            summary: 'Obtener equipo por nombre',
        },
    }, async (request, reply) => {
        try {
            const getTeamByName = resolveGetTeamByName(request);
            const { name } = request.params;
            const result = await getTeamByName.execute(decodeURIComponent(name));
            if (!result.ok) {
                const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(result.error);
                return reply.code(statusCode).send({ message });
            }
            return reply.code(200).send(toTeamResponse(result.value));
        }
        catch (error) {
            const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(error);
            return reply.code(statusCode).send({ message });
        }
    });
    zodServer.patch('/teams/:teamId', {
        preHandler: [requireAdmin],
        schema: {
            params: schemas_1.getTeamByIdParamsSchema,
            body: schemas_1.updateTeamBodySchema,
            response: {
                200: schemas_1.teamResponseSchema,
                400: http_response_schemas_1.httpErrorResponseSchema,
                401: http_response_schemas_1.httpErrorResponseSchema,
                403: http_response_schemas_1.httpErrorResponseSchema,
                404: http_response_schemas_1.httpErrorResponseSchema,
                409: http_response_schemas_1.httpErrorResponseSchema,
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['teams'],
            summary: 'Actualizar equipo',
            security: [{ bearerAuth: [] }],
        },
    }, async (request, reply) => {
        try {
            const updateTeam = resolveUpdateTeam(request);
            const { teamId: rawId } = request.params;
            const body = request.body;
            const teamId = TeamId_value_object_1.TeamId.fromString(rawId);
            const result = await updateTeam.execute({
                id: teamId,
                name: body.name,
            });
            if (!result.ok) {
                const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(result.error);
                return reply
                    .code(statusCode)
                    .send({ message });
            }
            return reply.code(200).send(toTeamResponse(result.value));
        }
        catch (error) {
            const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(error);
            return reply
                .code(statusCode)
                .send({ message });
        }
    });
    zodServer.delete('/teams/:teamId', {
        preHandler: [requireAdmin],
        schema: {
            params: schemas_1.getTeamByIdParamsSchema,
            response: {
                204: zod_1.z.any(),
                400: http_response_schemas_1.httpErrorResponseSchema,
                401: http_response_schemas_1.httpErrorResponseSchema,
                403: http_response_schemas_1.httpErrorResponseSchema,
                404: http_response_schemas_1.httpErrorResponseSchema,
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['teams'],
            summary: 'Eliminar equipo',
            security: [{ bearerAuth: [] }],
        },
    }, async (request, reply) => {
        try {
            const deleteTeam = resolveDeleteTeam(request);
            const { teamId: rawId } = request.params;
            const teamId = TeamId_value_object_1.TeamId.fromString(rawId);
            const result = await deleteTeam.execute(teamId);
            if (!result.ok) {
                const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(result.error);
                return reply
                    .code(statusCode)
                    .send({ message });
            }
            return reply.code(204).send();
        }
        catch (error) {
            const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(error);
            return reply
                .code(statusCode)
                .send({ message });
        }
    });
}
