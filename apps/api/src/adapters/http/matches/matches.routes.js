"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchesRoutes = matchesRoutes;
const GenerateSeasonCalendar_use_case_1 = require("@/application/use-cases/matches/GenerateSeasonCalendar.use-case");
const GetMatchById_use_case_1 = require("@/application/use-cases/matches/GetMatchById.use-case");
const UpdateMatchScore_use_case_1 = require("@/application/use-cases/matches/UpdateMatchScore.use-case");
const UpdateMatchStatus_use_case_1 = require("@/application/use-cases/matches/UpdateMatchStatus.use-case");
const UpdateSeasonRoundDate_use_case_1 = require("@/application/use-cases/matches/UpdateSeasonRoundDate.use-case");
const errors_1 = require("@/domain/shared/errors");
const auth_plugin_1 = require("@/adapters/http/auth/auth-plugin");
const http_error_mapper_1 = require("@/adapters/http/http-error-mapper");
const http_response_schemas_1 = require("@/adapters/http/http-response-schemas");
const MatchId_value_object_1 = require("@/domain/matches/MatchId.value-object");
const SeasonId_value_object_1 = require("@/domain/seasons/SeasonId.value-object");
const TeamSeasonId_value_object_1 = require("@/domain/rosters/TeamSeasonId.value-object");
const pagination_1 = require("@/shared/pagination");
const schemas_1 = require("./schemas");
/**
 * Resuelve Team persistido para un TeamSeason; nunca devuelve un TeamSeason id como teamId ni como nombre.
 */
function teamPayloadForSeasonMatch(teamsByTeamSeasonId, teamSeasonId, side) {
    const team = teamsByTeamSeasonId.get(teamSeasonId);
    if (team === undefined || team === null || team.id === undefined) {
        throw new errors_1.InfrastructureError(`No se pudo resolver el equipo ${side} para un partido (TeamSeason ${teamSeasonId}).`);
    }
    return { teamId: team.id.value, name: team.name };
}
/**
 * Plugin HTTP para las rutas de Matches.
 *
 * - POST /seasons/:seasonId/calendar/generate -> Generar calendario de temporada (ADMIN)
 * - PATCH /seasons/:seasonId/rounds/:round/date -> Ajustar fecha de jornada (ADMIN)
 * - PATCH /matches/:matchId/score -> Actualizar marcador de partido (ADMIN)
 * - GET /seasons/:seasonId/matches -> Listar partidos de temporada (paginado + filtro round)
 */
async function matchesRoutes(server, options = {}) {
    const zodServer = server.withTypeProvider();
    const requireAdmin = (0, auth_plugin_1.createRequireAdmin)(options.jwtService ?? server.container.cradle.jwtService);
    const resolveGenerateSeasonCalendar = (request) => options.generateSeasonCalendar ??
        (options.repository && options.rosterRepository && options.seasonRepository
            ? new GenerateSeasonCalendar_use_case_1.GenerateSeasonCalendar(options.repository, options.rosterRepository, options.seasonRepository)
            : request.container.cradle.generateSeasonCalendar);
    const resolveUpdateMatchScore = (request) => options.updateMatchScore ??
        (options.repository
            ? new UpdateMatchScore_use_case_1.UpdateMatchScore(options.repository)
            : request.container.cradle.updateMatchScore);
    const resolveGetMatchById = (request) => options.getMatchById ??
        (options.repository
            ? new GetMatchById_use_case_1.GetMatchById(options.repository)
            : request.container.cradle.getMatchById);
    const resolveTeamRepository = (request) => options.teamRepository ?? request.container.cradle.teamRepository;
    const resolveRosterRepository = (request) => options.rosterRepository ?? request.container.cradle.rosterRepository;
    const resolveUpdateMatchStatus = (request) => options.updateMatchStatus ??
        (options.repository
            ? new UpdateMatchStatus_use_case_1.UpdateMatchStatus(options.repository)
            : request.container.cradle.updateMatchStatus);
    const resolveUpdateSeasonRoundDate = (request) => options.updateSeasonRoundDate ??
        (options.repository
            ? new UpdateSeasonRoundDate_use_case_1.UpdateSeasonRoundDate(options.repository)
            : request.container.cradle.updateSeasonRoundDate);
    /**
     * POST /seasons/:seasonId/calendar/generate
     *
     * Genera el calendario round-robin de una temporada.
     * - 201: Calendario generado
     * - 400: Datos inválidos / equipos insuficientes
     * - 401: Token ausente o inválido
     * - 403: Usuario no admin
     * - 404: Temporada no encontrada
     * - 409: Calendario ya generado
     */
    zodServer.post('/seasons/:seasonId/calendar/generate', {
        preHandler: [requireAdmin],
        schema: {
            params: schemas_1.generateSeasonCalendarParamsSchema,
            body: schemas_1.generateSeasonCalendarBodySchema,
            response: {
                201: schemas_1.generateSeasonCalendarResponseSchema,
                400: http_response_schemas_1.httpErrorResponseSchema,
                401: http_response_schemas_1.httpErrorResponseSchema,
                403: http_response_schemas_1.httpErrorResponseSchema,
                404: http_response_schemas_1.httpErrorResponseSchema,
                409: http_response_schemas_1.httpErrorResponseSchema,
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['matches'],
            summary: 'Generar calendario de temporada',
            security: [{ bearerAuth: [] }],
        },
    }, async (request, reply) => {
        try {
            const generateSeasonCalendar = resolveGenerateSeasonCalendar(request);
            const { seasonId } = request.params;
            const body = request.body;
            const result = await generateSeasonCalendar.execute({
                seasonId: SeasonId_value_object_1.SeasonId.fromString(seasonId),
                ...(body?.startDate ? { startDate: new Date(body.startDate) } : {}),
                ...(body?.doubleRoundRobin !== undefined
                    ? { doubleRoundRobin: body.doubleRoundRobin }
                    : {}),
            });
            if (!result.ok) {
                const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(result.error);
                return reply
                    .code(statusCode)
                    .send({ message });
            }
            return reply.code(201).send({ matchesCount: result.value.length });
        }
        catch (error) {
            const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(error);
            return reply
                .code(statusCode)
                .send({ message });
        }
    });
    /**
     * PATCH /matches/:matchId/score
     *
     * Actualiza el marcador de un partido.
     * - 200: Marcador actualizado
     * - 400: Marcador inválido / partido cancelado
     * - 401: Token ausente o inválido
     * - 403: Usuario no admin
     * - 404: Partido no encontrado
     */
    zodServer.patch('/matches/:matchId/score', {
        preHandler: [requireAdmin],
        schema: {
            params: schemas_1.updateMatchScoreParamsSchema,
            body: schemas_1.updateMatchScoreBodySchema,
            response: {
                200: schemas_1.updateMatchScoreResponseSchema,
                400: http_response_schemas_1.httpErrorResponseSchema,
                401: http_response_schemas_1.httpErrorResponseSchema,
                403: http_response_schemas_1.httpErrorResponseSchema,
                404: http_response_schemas_1.httpErrorResponseSchema,
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['matches'],
            summary: 'Actualizar resultado de partido',
            security: [{ bearerAuth: [] }],
        },
    }, async (request, reply) => {
        try {
            const updateMatchScore = resolveUpdateMatchScore(request);
            const { matchId } = request.params;
            const body = request.body;
            const result = await updateMatchScore.execute({
                matchId: MatchId_value_object_1.MatchId.fromString(matchId),
                homeScore: body.homeScore,
                awayScore: body.awayScore,
            });
            if (!result.ok) {
                const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(result.error);
                return reply.code(statusCode).send({ message });
            }
            return reply.code(200).send({ matchId: result.value.matchId });
        }
        catch (error) {
            const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(error);
            return reply.code(statusCode).send({ message });
        }
    });
    /**
     * PATCH /seasons/:seasonId/rounds/:round/date
     *
     * Ajusta manualmente la fecha de todos los partidos de una jornada.
     * - 200: Jornada actualizada
     * - 401: Token ausente o inválido
     * - 403: Usuario no admin
     * - 404: Season/jornada sin partidos
     */
    zodServer.patch('/seasons/:seasonId/rounds/:round/date', {
        preHandler: [requireAdmin],
        schema: {
            params: schemas_1.updateSeasonRoundDateParamsSchema,
            body: schemas_1.updateSeasonRoundDateBodySchema,
            response: {
                200: schemas_1.updateSeasonRoundDateResponseSchema,
                400: http_response_schemas_1.httpErrorResponseSchema,
                401: http_response_schemas_1.httpErrorResponseSchema,
                403: http_response_schemas_1.httpErrorResponseSchema,
                404: http_response_schemas_1.httpErrorResponseSchema,
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['matches'],
            summary: 'Actualizar fecha de jornada',
            security: [{ bearerAuth: [] }],
        },
    }, async (request, reply) => {
        try {
            const updateSeasonRoundDate = resolveUpdateSeasonRoundDate(request);
            const params = request.params;
            const body = request.body;
            const result = await updateSeasonRoundDate.execute({
                seasonId: SeasonId_value_object_1.SeasonId.fromString(params.seasonId),
                round: params.round,
                date: new Date(body.date),
            });
            if (!result.ok) {
                const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(result.error);
                return reply.code(statusCode).send({ message });
            }
            return reply.code(200).send({ updatedMatches: result.value.updatedMatches });
        }
        catch (error) {
            const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(error);
            return reply.code(statusCode).send({ message });
        }
    });
    /**
     * GET /matches/:matchId
     *
     * Obtiene un partido por identificador.
     * - 200: Partido encontrado
     * - 404: Partido no encontrado
     */
    zodServer.get('/matches/:matchId', {
        schema: {
            params: schemas_1.updateMatchScoreParamsSchema,
            response: {
                200: schemas_1.matchResponseSchema,
                400: http_response_schemas_1.httpErrorResponseSchema,
                404: http_response_schemas_1.httpErrorResponseSchema,
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['matches'],
            summary: 'Obtener partido por id',
        },
    }, async (request, reply) => {
        try {
            const getMatchById = resolveGetMatchById(request);
            const teamRepository = resolveTeamRepository(request);
            const rosterRepository = resolveRosterRepository(request);
            const { matchId } = request.params;
            const result = await getMatchById.execute(MatchId_value_object_1.MatchId.fromString(matchId));
            if (!result.ok) {
                const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(result.error);
                return reply.code(statusCode).send({ message });
            }
            const match = result.value;
            const [homeTeamSeason, awayTeamSeason] = await Promise.all([
                rosterRepository.findById(TeamSeasonId_value_object_1.TeamSeasonId.fromString(match.homeTeamSeasonId.value)),
                rosterRepository.findById(TeamSeasonId_value_object_1.TeamSeasonId.fromString(match.awayTeamSeasonId.value)),
            ]);
            if (homeTeamSeason === null || awayTeamSeason === null) {
                return reply.code(500).send({ message: 'No se pudo resolver TeamSeason para el match' });
            }
            const [homeTeam, awayTeam] = await Promise.all([
                teamRepository.findById(homeTeamSeason.teamId),
                teamRepository.findById(awayTeamSeason.teamId),
            ]);
            if (homeTeam === null || awayTeam === null) {
                return reply.code(500).send({ message: 'No se pudo resolver Team para el match' });
            }
            return reply.code(200).send({
                id: match.id.value,
                seasonId: match.seasonId.value,
                homeTeamSeasonId: match.homeTeamSeasonId.value,
                awayTeamSeasonId: match.awayTeamSeasonId.value,
                homeTeam: { teamId: homeTeam.id.value, name: homeTeam.name },
                awayTeam: { teamId: awayTeam.id.value, name: awayTeam.name },
                homeScore: match.score.home,
                awayScore: match.score.away,
                date: match.date.toISOString(),
                round: match.round,
                status: match.status,
            });
        }
        catch (error) {
            const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(error);
            return reply.code(statusCode).send({ message });
        }
    });
    /**
     * PATCH /matches/:matchId/status
     *
     * Actualiza el estado operativo del partido.
     * - 200: Estado actualizado
     * - 401: Token ausente o inválido
     * - 403: Usuario no admin
     * - 404: Partido no encontrado
     */
    zodServer.patch('/matches/:matchId/status', {
        preHandler: [requireAdmin],
        schema: {
            params: schemas_1.updateMatchScoreParamsSchema,
            body: schemas_1.updateMatchStatusBodySchema,
            response: {
                200: schemas_1.updateMatchScoreResponseSchema,
                400: http_response_schemas_1.httpErrorResponseSchema,
                401: http_response_schemas_1.httpErrorResponseSchema,
                403: http_response_schemas_1.httpErrorResponseSchema,
                404: http_response_schemas_1.httpErrorResponseSchema,
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['matches'],
            summary: 'Actualizar estado de partido',
            security: [{ bearerAuth: [] }],
        },
    }, async (request, reply) => {
        try {
            const updateMatchStatus = resolveUpdateMatchStatus(request);
            const { matchId } = request.params;
            const body = request.body;
            const result = await updateMatchStatus.execute({
                matchId: MatchId_value_object_1.MatchId.fromString(matchId),
                status: body.status,
            });
            if (!result.ok) {
                const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(result.error);
                return reply.code(statusCode).send({ message });
            }
            return reply.code(200).send({ matchId: result.value.matchId });
        }
        catch (error) {
            const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(error);
            return reply.code(statusCode).send({ message });
        }
    });
    /**
     * GET /seasons/:seasonId/matches
     *
     * Lista los partidos de una temporada con paginación y filtro opcional por jornada.
     * - 200: Listado paginado
     * - 400: Parámetros inválidos
     * - público (sin autenticación)
     * - 500: Error inesperado o datos incoherentes (p. ej. partido con TeamSeason sin roster o sin Team)
     */
    zodServer.get('/seasons/:seasonId/matches', {
        schema: {
            params: schemas_1.generateSeasonCalendarParamsSchema,
            querystring: schemas_1.listSeasonMatchesQuerySchema,
            response: {
                200: schemas_1.listSeasonMatchesResponseSchema,
                400: http_response_schemas_1.httpErrorResponseSchema,
                500: http_response_schemas_1.httpErrorResponseSchema,
            },
            tags: ['matches'],
            summary: 'Listar partidos de temporada',
        },
    }, async (request, reply) => {
        try {
            const { seasonId } = request.params;
            const query = request.query;
            const repository = options.repository ?? request.container.cradle.matchRepository;
            const teamRepository = resolveTeamRepository(request);
            const rosterRepository = resolveRosterRepository(request);
            const result = await repository.findBySeasonId(SeasonId_value_object_1.SeasonId.fromString(seasonId), query);
            const teamSeasonIds = Array.from(new Set(result.data.flatMap((match) => [
                match.homeTeamSeasonId.value,
                match.awayTeamSeasonId.value,
            ])));
            const teamSeasonEntries = await Promise.all(teamSeasonIds.map(async (teamSeasonId) => {
                const roster = await rosterRepository.findById(TeamSeasonId_value_object_1.TeamSeasonId.fromString(teamSeasonId));
                if (roster === null) {
                    return [teamSeasonId, null];
                }
                const team = await teamRepository.findById(roster.teamId);
                return [teamSeasonId, team];
            }));
            const teamsByTeamSeasonId = new Map(teamSeasonEntries);
            return reply.code(200).send({
                data: result.data.map((match) => ({
                    id: match.id.value,
                    seasonId: match.seasonId.value,
                    homeTeamSeasonId: match.homeTeamSeasonId.value,
                    awayTeamSeasonId: match.awayTeamSeasonId.value,
                    homeTeam: teamPayloadForSeasonMatch(teamsByTeamSeasonId, match.homeTeamSeasonId.value, 'local'),
                    awayTeam: teamPayloadForSeasonMatch(teamsByTeamSeasonId, match.awayTeamSeasonId.value, 'visitante'),
                    homeScore: match.score.home,
                    awayScore: match.score.away,
                    date: match.date.toISOString(),
                    round: match.round,
                    status: match.status,
                })),
                meta: {
                    total: result.total,
                    page: query.page,
                    lastPage: (0, pagination_1.computeLastPage)(result.total, query.limit),
                },
            });
        }
        catch (error) {
            const { statusCode, message } = (0, http_error_mapper_1.mapDomainErrorToHttp)(error);
            return reply.code(statusCode).send({ message });
        }
    });
}
