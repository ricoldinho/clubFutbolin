"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rostersRoutes = rostersRoutes;
const RegisterTeamToSeason_use_case_1 = require("@/application/use-cases/rosters/RegisterTeamToSeason.use-case");
const AddPlayerToRoster_use_case_1 = require("@/application/use-cases/rosters/AddPlayerToRoster.use-case");
const RemovePlayerFromRoster_use_case_1 = require("@/application/use-cases/rosters/RemovePlayerFromRoster.use-case");
const TeamSeasonId_value_object_1 = require("@/domain/rosters/TeamSeasonId.value-object");
const TeamId_value_object_1 = require("@/domain/teams/TeamId.value-object");
const SeasonId_value_object_1 = require("@/domain/seasons/SeasonId.value-object");
const PlayerId_value_object_1 = require("@/domain/players/value-objects/PlayerId.value-object");
const Position_1 = require("@/domain/rosters/Position");
const http_error_mapper_1 = require("@/adapters/http/http-error-mapper");
const auth_plugin_1 = require("@/adapters/http/auth/auth-plugin");
const schemas_1 = require("./schemas");
const http_response_schemas_1 = require("@/adapters/http/http-response-schemas");
async function rostersRoutes(server, options = {}) {
    const zodServer = server.withTypeProvider();
    const requireAdmin = (0, auth_plugin_1.createRequireAdmin)(options.jwtService ?? server.container.cradle.jwtService);
    const resolveRegisterTeamToSeason = (request) => options.registerTeamToSeason ??
        (options.repository && options.teamRepository && options.seasonRepository
            ? new RegisterTeamToSeason_use_case_1.RegisterTeamToSeason(options.repository, options.teamRepository, options.seasonRepository)
            : request.container.cradle.registerTeamToSeason);
    const resolveAddPlayerToRoster = (request) => options.addPlayerToRoster ??
        (options.repository
            ? new AddPlayerToRoster_use_case_1.AddPlayerToRoster(options.repository)
            : request.container.cradle.addPlayerToRoster);
    const resolveRemovePlayerFromRoster = (request) => options.removePlayerFromRoster ??
        (options.repository
            ? new RemovePlayerFromRoster_use_case_1.RemovePlayerFromRoster(options.repository)
            : request.container.cradle.removePlayerFromRoster);
    zodServer.post('/rosters/register', {
        preHandler: [requireAdmin],
        schema: {
            body: schemas_1.registerTeamToSeasonBodySchema,
            response: {
                201: schemas_1.registerTeamToSeasonResponseSchema,
                400: http_response_schemas_1.httpErrorResponseSchema,
                401: http_response_schemas_1.httpErrorResponseSchema,
                403: http_response_schemas_1.httpErrorResponseSchema,
                404: http_response_schemas_1.httpErrorResponseSchema,
                409: http_response_schemas_1.httpErrorResponseSchema,
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['rosters'],
            summary: 'Inscribir equipo en temporada',
            security: [{ bearerAuth: [] }],
        },
    }, async (request, reply) => {
        try {
            const registerTeamToSeason = resolveRegisterTeamToSeason(request);
            const body = request.body;
            const result = await registerTeamToSeason.execute({
                teamId: TeamId_value_object_1.TeamId.fromString(body.teamId),
                seasonId: SeasonId_value_object_1.SeasonId.fromString(body.seasonId),
            });
            if (!result.ok) {
                const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(result.error);
                return reply
                    .code(statusCode)
                    .send({ message });
            }
            return reply.code(201).send({
                teamSeasonId: result.value.teamSeasonId.value,
                teamId: result.value.teamId.value,
                seasonId: result.value.seasonId.value,
                membersCount: result.value.members.length,
            });
        }
        catch (error) {
            const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(error);
            return reply
                .code(statusCode)
                .send({ message });
        }
    });
    zodServer.post('/rosters/:teamSeasonId/players', {
        preHandler: [requireAdmin],
        schema: {
            params: schemas_1.getRosterParamsSchema,
            body: schemas_1.addPlayerToRosterBodySchema,
            response: {
                200: schemas_1.addPlayerToRosterResponseSchema,
                400: http_response_schemas_1.httpErrorResponseSchema,
                401: http_response_schemas_1.httpErrorResponseSchema,
                403: http_response_schemas_1.httpErrorResponseSchema,
                404: http_response_schemas_1.httpErrorResponseSchema,
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['rosters'],
            summary: 'Añadir jugador al roster',
            security: [{ bearerAuth: [] }],
        },
    }, async (request, reply) => {
        try {
            const addPlayerToRoster = resolveAddPlayerToRoster(request);
            const { teamSeasonId: rawId } = request.params;
            const body = request.body;
            const result = await addPlayerToRoster.execute({
                teamSeasonId: TeamSeasonId_value_object_1.TeamSeasonId.fromString(rawId),
                playerId: PlayerId_value_object_1.PlayerId.fromString(body.playerId),
                position: (0, Position_1.parsePosition)(body.position),
            });
            if (!result.ok) {
                const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(result.error);
                return reply
                    .code(statusCode)
                    .send({ message });
            }
            return reply.code(200).send({ membersCount: result.value.members.length });
        }
        catch (error) {
            const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(error);
            return reply
                .code(statusCode)
                .send({ message });
        }
    });
    zodServer.delete('/rosters/:teamSeasonId/players/:playerId', {
        preHandler: [requireAdmin],
        schema: {
            params: schemas_1.removePlayerFromRosterParamsSchema,
            response: {
                200: schemas_1.removePlayerFromRosterResponseSchema,
                400: http_response_schemas_1.httpErrorResponseSchema,
                401: http_response_schemas_1.httpErrorResponseSchema,
                403: http_response_schemas_1.httpErrorResponseSchema,
                404: http_response_schemas_1.httpErrorResponseSchema,
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['rosters'],
            summary: 'Eliminar jugador del roster',
            security: [{ bearerAuth: [] }],
        },
    }, async (request, reply) => {
        try {
            const removePlayerFromRoster = resolveRemovePlayerFromRoster(request);
            const { teamSeasonId: rawTsId, playerId: rawPlayerId } = request.params;
            const result = await removePlayerFromRoster.execute({
                teamSeasonId: TeamSeasonId_value_object_1.TeamSeasonId.fromString(rawTsId),
                playerId: PlayerId_value_object_1.PlayerId.fromString(rawPlayerId),
            });
            if (!result.ok) {
                const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(result.error);
                return reply
                    .code(statusCode)
                    .send({ message });
            }
            return reply.code(200).send({ membersCount: result.value.members.length });
        }
        catch (error) {
            const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(error);
            return reply
                .code(statusCode)
                .send({ message });
        }
    });
}
