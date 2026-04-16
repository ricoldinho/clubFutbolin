"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seasonsRoutes = seasonsRoutes;
const CreateSeason_use_case_1 = require("@/application/use-cases/seasons/CreateSeason.use-case");
const ListSeasons_use_case_1 = require("@/application/use-cases/seasons/ListSeasons.use-case");
const GetSeasonById_use_case_1 = require("@/application/use-cases/seasons/GetSeasonById.use-case");
const SetSeasonWinners_use_case_1 = require("@/application/use-cases/seasons/SetSeasonWinners.use-case");
const SeasonId_value_object_1 = require("@/domain/seasons/SeasonId.value-object");
const LeagueId_value_object_1 = require("@/domain/leagues/LeagueId.value-object");
const TeamId_value_object_1 = require("@/domain/teams/TeamId.value-object");
const http_error_mapper_1 = require("@/adapters/http/http-error-mapper");
const auth_plugin_1 = require("@/adapters/http/auth/auth-plugin");
const schemas_1 = require("./schemas");
const pagination_1 = require("@/shared/pagination");
const http_response_schemas_1 = require("@/adapters/http/http-response-schemas");
function toSeasonResponse(season) {
    return {
        id: season.id?.value ?? null,
        year: season.year,
        leagueId: season.leagueId.value,
        championId: season.championId?.value ?? null,
        secondId: season.secondId?.value ?? null,
    };
}
async function seasonsRoutes(server, options = {}) {
    const zodServer = server.withTypeProvider();
    const requireAdmin = (0, auth_plugin_1.createRequireAdmin)(options.jwtService ?? server.container.cradle.jwtService);
    const resolveCreateSeason = (request) => options.createSeason ??
        (options.repository && options.leagueRepository
            ? new CreateSeason_use_case_1.CreateSeason(options.repository, options.leagueRepository)
            : request.container.cradle.createSeason);
    const resolveListSeasons = (request) => options.listSeasons ??
        (options.repository
            ? new ListSeasons_use_case_1.ListSeasons(options.repository)
            : request.container.cradle.listSeasons);
    const resolveGetSeasonById = (request) => options.getSeasonById ??
        (options.repository
            ? new GetSeasonById_use_case_1.GetSeasonById(options.repository)
            : request.container.cradle.getSeasonById);
    const resolveSetSeasonWinners = (request) => options.setSeasonWinners ??
        (options.repository && options.teamRepository
            ? new SetSeasonWinners_use_case_1.SetSeasonWinners(options.repository, options.teamRepository)
            : request.container.cradle.setSeasonWinners);
    zodServer.post('/seasons', {
        preHandler: [requireAdmin],
        schema: {
            body: schemas_1.createSeasonBodySchema,
            response: {
                201: schemas_1.seasonResponseSchema,
                400: http_response_schemas_1.httpErrorResponseSchema,
                401: http_response_schemas_1.httpErrorResponseSchema,
                403: http_response_schemas_1.httpErrorResponseSchema,
                404: http_response_schemas_1.httpErrorResponseSchema,
                409: http_response_schemas_1.httpErrorResponseSchema,
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['seasons'],
            summary: 'Crear temporada',
            security: [{ bearerAuth: [] }],
        },
    }, async (request, reply) => {
        try {
            const createSeason = resolveCreateSeason(request);
            const body = request.body;
            const result = await createSeason.execute({
                year: body.year,
                leagueId: LeagueId_value_object_1.LeagueId.fromString(body.leagueId),
            });
            if (!result.ok) {
                const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(result.error);
                return reply
                    .code(statusCode)
                    .send({ message });
            }
            return reply.code(201).send(toSeasonResponse(result.value));
        }
        catch (error) {
            const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(error);
            return reply
                .code(statusCode)
                .send({ message });
        }
    });
    zodServer.get('/seasons', {
        schema: {
            querystring: schemas_1.listSeasonsQuerySchema,
            response: {
                200: schemas_1.listSeasonsResponseSchema,
                400: http_response_schemas_1.httpErrorResponseSchema,
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['seasons'],
            summary: 'Listar temporadas paginadas',
        },
    }, async (_request, reply) => {
        try {
            const listSeasons = resolveListSeasons(_request);
            const query = _request.query;
            const result = await listSeasons.execute({
                pagination: { page: query.page, limit: query.limit },
            });
            if (!result.ok) {
                const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(result.error);
                return reply
                    .code(statusCode)
                    .send({ message });
            }
            return reply.code(200).send({
                data: result.value.data.map(toSeasonResponse),
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
    zodServer.get('/seasons/:seasonId', {
        schema: {
            params: schemas_1.getSeasonByIdParamsSchema,
            response: {
                200: schemas_1.seasonResponseSchema,
                400: http_response_schemas_1.httpErrorResponseSchema,
                404: http_response_schemas_1.httpErrorResponseSchema,
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['seasons'],
            summary: 'Obtener temporada por id',
        },
    }, async (request, reply) => {
        try {
            const getSeasonById = resolveGetSeasonById(request);
            const { seasonId: rawId } = request.params;
            const result = await getSeasonById.execute(SeasonId_value_object_1.SeasonId.fromString(rawId));
            if (!result.ok) {
                const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(result.error);
                return reply.code(statusCode).send({ message });
            }
            return reply.code(200).send(toSeasonResponse(result.value));
        }
        catch (error) {
            const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(error);
            return reply.code(statusCode).send({ message });
        }
    });
    zodServer.patch('/seasons/:seasonId/winners', {
        preHandler: [requireAdmin],
        schema: {
            params: schemas_1.getSeasonByIdParamsSchema,
            body: schemas_1.setSeasonWinnersBodySchema,
            response: {
                200: schemas_1.seasonResponseSchema,
                400: http_response_schemas_1.httpErrorResponseSchema,
                401: http_response_schemas_1.httpErrorResponseSchema,
                403: http_response_schemas_1.httpErrorResponseSchema,
                404: http_response_schemas_1.httpErrorResponseSchema,
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['seasons'],
            summary: 'Actualizar ganadores',
            security: [{ bearerAuth: [] }],
        },
    }, async (request, reply) => {
        try {
            const setSeasonWinners = resolveSetSeasonWinners(request);
            const { seasonId: rawId } = request.params;
            const body = request.body;
            const result = await setSeasonWinners.execute({
                seasonId: SeasonId_value_object_1.SeasonId.fromString(rawId),
                championId: TeamId_value_object_1.TeamId.fromString(body.championId),
                secondId: TeamId_value_object_1.TeamId.fromString(body.secondId),
            });
            if (!result.ok) {
                const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(result.error);
                return reply
                    .code(statusCode)
                    .send({ message });
            }
            return reply.code(200).send(toSeasonResponse(result.value));
        }
        catch (error) {
            const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(error);
            return reply
                .code(statusCode)
                .send({ message });
        }
    });
}
