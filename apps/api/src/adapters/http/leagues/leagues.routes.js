"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaguesRoutes = leaguesRoutes;
const zod_1 = require("zod");
const CreateLeague_use_case_1 = require("@/application/use-cases/leagues/CreateLeague.use-case");
const UpdateLeague_use_case_1 = require("@/application/use-cases/leagues/UpdateLeague.use-case");
const DeleteLeague_use_case_1 = require("@/application/use-cases/leagues/DeleteLeague.use-case");
const ListLeagues_use_case_1 = require("@/application/use-cases/leagues/ListLeagues.use-case");
const GetLeagueById_use_case_1 = require("@/application/use-cases/leagues/GetLeagueById.use-case");
const LeagueId_value_object_1 = require("@/domain/leagues/LeagueId.value-object");
const SeasonId_value_object_1 = require("@/domain/seasons/SeasonId.value-object");
const LeagueCategory_1 = require("@/domain/leagues/LeagueCategory");
const http_error_mapper_1 = require("@/adapters/http/http-error-mapper");
const auth_plugin_1 = require("@/adapters/http/auth/auth-plugin");
const schemas_1 = require("./schemas");
const pagination_1 = require("@/shared/pagination");
const http_response_schemas_1 = require("@/adapters/http/http-response-schemas");
function toLeagueResponse(league) {
    return {
        id: league.id?.value ?? null,
        name: league.name,
        leagueCategory: league.leagueCategory,
    };
}
async function leaguesRoutes(server, options = {}) {
    const zodServer = server.withTypeProvider();
    const requireAdmin = (0, auth_plugin_1.createRequireAdmin)(options.jwtService ?? server.container.cradle.jwtService);
    const resolveCreateLeague = (request) => options.createLeague ??
        (options.repository
            ? new CreateLeague_use_case_1.CreateLeague(options.repository)
            : request.container.cradle.createLeague);
    const resolveUpdateLeague = (request) => options.updateLeague ??
        (options.repository
            ? new UpdateLeague_use_case_1.UpdateLeague(options.repository)
            : request.container.cradle.updateLeague);
    const resolveDeleteLeague = (request) => options.deleteLeague ??
        (options.repository
            ? new DeleteLeague_use_case_1.DeleteLeague(options.repository)
            : request.container.cradle.deleteLeague);
    const resolveListLeagues = (request) => options.listLeagues ??
        (options.repository
            ? new ListLeagues_use_case_1.ListLeagues(options.repository)
            : request.container.cradle.listLeagues);
    const resolveGetLeagueById = (request) => options.getLeagueById ??
        (options.repository
            ? new GetLeagueById_use_case_1.GetLeagueById(options.repository)
            : request.container.cradle.getLeagueById);
    const resolveSeasonRepository = (request) => options.seasonRepository ?? request.container.cradle.seasonRepository;
    const resolveRosterRepository = (request) => options.rosterRepository ?? request.container.cradle.rosterRepository;
    const resolveTeamRepository = (request) => options.teamRepository ?? request.container.cradle.teamRepository;
    zodServer.post('/leagues', {
        preHandler: [requireAdmin],
        schema: {
            body: schemas_1.createLeagueBodySchema,
            response: {
                201: schemas_1.createdLeagueResponseSchema,
                400: http_response_schemas_1.httpErrorResponseSchema,
                401: http_response_schemas_1.httpErrorResponseSchema,
                403: http_response_schemas_1.httpErrorResponseSchema,
                409: http_response_schemas_1.httpErrorResponseSchema,
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['leagues'],
            summary: 'Crear liga',
            security: [{ bearerAuth: [] }],
        },
    }, async (request, reply) => {
        try {
            const createLeague = resolveCreateLeague(request);
            const body = request.body;
            const result = await createLeague.execute({
                name: body.name,
                leagueCategory: (0, LeagueCategory_1.parseLeagueCategory)(body.leagueCategory),
            });
            if (!result.ok) {
                const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(result.error);
                return reply
                    .code(statusCode)
                    .send({ message });
            }
            return reply.code(201).send({
                ...toLeagueResponse(result.value.league),
                initialSeason: {
                    id: result.value.initialSeason.id?.value ?? null,
                    year: result.value.initialSeason.year,
                    leagueId: result.value.initialSeason.leagueId.value,
                    championId: result.value.initialSeason.championId?.value ?? null,
                    secondId: result.value.initialSeason.secondId?.value ?? null,
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
    zodServer.get('/leagues', {
        schema: {
            querystring: schemas_1.listLeaguesQuerySchema,
            response: {
                200: schemas_1.listLeaguesResponseSchema,
                400: http_response_schemas_1.httpErrorResponseSchema,
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['leagues'],
            summary: 'Listar ligas paginadas',
        },
    }, async (_request, reply) => {
        try {
            const listLeagues = resolveListLeagues(_request);
            const query = _request.query;
            const result = await listLeagues.execute({
                pagination: { page: query.page, limit: query.limit },
            });
            if (!result.ok) {
                const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(result.error);
                return reply
                    .code(statusCode)
                    .send({ message });
            }
            return reply.code(200).send({
                data: result.value.data.map(toLeagueResponse),
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
    zodServer.get('/leagues/:leagueId/seasons', {
        schema: {
            params: schemas_1.getLeagueByIdParamsSchema,
            response: {
                200: schemas_1.leagueSeasonsResponseSchema,
                400: http_response_schemas_1.httpErrorResponseSchema,
                404: http_response_schemas_1.httpErrorResponseSchema,
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['leagues'],
            summary: 'Listar seasons de una liga',
        },
    }, async (request, reply) => {
        try {
            const leagueId = LeagueId_value_object_1.LeagueId.fromString(request.params.leagueId);
            const league = await (options.repository ?? request.container.cradle.leagueRepository).findById(leagueId);
            if (league === null) {
                return reply.code(404).send({ message: `League with id "${leagueId.value}" not found` });
            }
            const seasons = await resolveSeasonRepository(request).findByLeagueId(leagueId);
            const sorted = [...seasons].sort((a, b) => b.year - a.year);
            return reply.code(200).send({
                data: sorted.map((season) => ({
                    id: season.id.value,
                    year: season.year,
                    leagueId: season.leagueId.value,
                    championId: season.championId?.value ?? null,
                    secondId: season.secondId?.value ?? null,
                })),
            });
        }
        catch (error) {
            const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(error);
            return reply.code(statusCode).send({ message });
        }
    });
    zodServer.get('/leagues/:leagueId/seasons/:seasonId/teams-by-category', {
        schema: {
            params: schemas_1.getLeagueByIdParamsSchema.extend({
                seasonId: schemas_1.getLeagueByIdParamsSchema.shape.leagueId,
            }),
            response: {
                200: schemas_1.seasonTeamsByCategoryResponseSchema,
                400: http_response_schemas_1.httpErrorResponseSchema,
                404: http_response_schemas_1.httpErrorResponseSchema,
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['leagues'],
            summary: 'Equipos de una season agrupados por categoría',
        },
    }, async (request, reply) => {
        try {
            const params = request.params;
            const leagueId = LeagueId_value_object_1.LeagueId.fromString(params.leagueId);
            const seasonId = params.seasonId;
            const league = await (options.repository ?? request.container.cradle.leagueRepository).findById(leagueId);
            if (league === null) {
                return reply.code(404).send({ message: `League with id "${leagueId.value}" not found` });
            }
            const season = await resolveSeasonRepository(request).findById(SeasonId_value_object_1.SeasonId.fromString(seasonId));
            if (season === null || !season.leagueId.equals(leagueId)) {
                return reply.code(404).send({ message: 'Season no encontrada para esta liga' });
            }
            const rosters = await resolveRosterRepository(request).findBySeasonId(season.id);
            const teamRepository = resolveTeamRepository(request);
            const teams = await Promise.all(rosters.map(async (roster) => {
                const team = await teamRepository.findById(roster.teamId);
                return team ? { id: team.id.value, name: team.name } : null;
            }));
            return reply.code(200).send({
                seasonId: season.id.value,
                categories: [
                    {
                        category: league.leagueCategory,
                        teams: teams.filter((team) => team !== null),
                    },
                ],
            });
        }
        catch (error) {
            const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(error);
            return reply.code(statusCode).send({ message });
        }
    });
    zodServer.get('/leagues/:leagueId', {
        schema: {
            params: schemas_1.getLeagueByIdParamsSchema,
            response: {
                200: schemas_1.leagueResponseSchema,
                400: http_response_schemas_1.httpErrorResponseSchema,
                404: http_response_schemas_1.httpErrorResponseSchema,
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['leagues'],
            summary: 'Obtener liga por id',
        },
    }, async (request, reply) => {
        try {
            const getLeagueById = resolveGetLeagueById(request);
            const { leagueId: rawId } = request.params;
            const leagueId = LeagueId_value_object_1.LeagueId.fromString(rawId);
            const result = await getLeagueById.execute(leagueId);
            if (!result.ok) {
                const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(result.error);
                return reply
                    .code(statusCode)
                    .send({ message });
            }
            return reply.code(200).send(toLeagueResponse(result.value));
        }
        catch (error) {
            const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(error);
            return reply
                .code(statusCode)
                .send({ message });
        }
    });
    zodServer.patch('/leagues/:leagueId', {
        preHandler: [requireAdmin],
        schema: {
            params: schemas_1.getLeagueByIdParamsSchema,
            body: schemas_1.updateLeagueBodySchema,
            response: {
                200: schemas_1.leagueResponseSchema,
                400: http_response_schemas_1.httpErrorResponseSchema,
                401: http_response_schemas_1.httpErrorResponseSchema,
                403: http_response_schemas_1.httpErrorResponseSchema,
                404: http_response_schemas_1.httpErrorResponseSchema,
                409: http_response_schemas_1.httpErrorResponseSchema,
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['leagues'],
            summary: 'Actualizar liga',
            security: [{ bearerAuth: [] }],
        },
    }, async (request, reply) => {
        try {
            const updateLeague = resolveUpdateLeague(request);
            const { leagueId: rawId } = request.params;
            const body = request.body;
            const leagueId = LeagueId_value_object_1.LeagueId.fromString(rawId);
            const result = await updateLeague.execute({
                id: leagueId,
                name: body.name,
                leagueCategory: body.leagueCategory
                    ? (0, LeagueCategory_1.parseLeagueCategory)(body.leagueCategory)
                    : undefined,
            });
            if (!result.ok) {
                const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(result.error);
                return reply
                    .code(statusCode)
                    .send({ message });
            }
            return reply.code(200).send(toLeagueResponse(result.value));
        }
        catch (error) {
            const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(error);
            return reply
                .code(statusCode)
                .send({ message });
        }
    });
    zodServer.delete('/leagues/:leagueId', {
        preHandler: [requireAdmin],
        schema: {
            params: schemas_1.getLeagueByIdParamsSchema,
            response: {
                204: zod_1.z.any(),
                400: http_response_schemas_1.httpErrorResponseSchema,
                401: http_response_schemas_1.httpErrorResponseSchema,
                403: http_response_schemas_1.httpErrorResponseSchema,
                404: http_response_schemas_1.httpErrorResponseSchema,
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['leagues'],
            summary: 'Eliminar liga',
            security: [{ bearerAuth: [] }],
        },
    }, async (request, reply) => {
        try {
            const deleteLeague = resolveDeleteLeague(request);
            const { leagueId: rawId } = request.params;
            const leagueId = LeagueId_value_object_1.LeagueId.fromString(rawId);
            const result = await deleteLeague.execute(leagueId);
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
