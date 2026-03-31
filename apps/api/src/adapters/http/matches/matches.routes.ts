import type { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { IJwtService } from '@/application/ports/auth/JwtService.port';
import type { IMatchRepository } from '@/application/ports/matches/Match.repository';
import type { IRosterRepository } from '@/application/ports/rosters/Roster.repository';
import type { ISeasonRepository } from '@/application/ports/seasons/Season.repository';
import { GenerateSeasonCalendar } from '@/application/use-cases/matches/GenerateSeasonCalendar.use-case';
import { GetMatchById } from '@/application/use-cases/matches/GetMatchById.use-case';
import { UpdateMatchScore } from '@/application/use-cases/matches/UpdateMatchScore.use-case';
import { UpdateMatchStatus } from '@/application/use-cases/matches/UpdateMatchStatus.use-case';
import { MatchStatus } from '@/domain/matches/MatchStatus';
import { createRequireAdmin } from '@/adapters/http/auth/auth-plugin';
import { mapDomainErrorToHttp } from '@/adapters/http/http-error-mapper';
import { httpErrorResponseSchema } from '@/adapters/http/http-response-schemas';
import { MatchId } from '@/domain/matches/MatchId.value-object';
import { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import { computeLastPage } from '@/shared/pagination';
import {
  generateSeasonCalendarBodySchema,
  generateSeasonCalendarParamsSchema,
  generateSeasonCalendarResponseSchema,
  listSeasonMatchesQuerySchema,
  listSeasonMatchesResponseSchema,
  type GenerateSeasonCalendarBody,
  type UpdateMatchScoreBody,
  type UpdateMatchStatusBody,
  matchResponseSchema,
  updateMatchScoreBodySchema,
  updateMatchScoreParamsSchema,
  updateMatchScoreResponseSchema,
  updateMatchStatusBodySchema,
} from './schemas';

interface MatchesRoutesOptions extends FastifyPluginOptions {
  repository?: IMatchRepository;
  rosterRepository?: IRosterRepository;
  seasonRepository?: ISeasonRepository;
  jwtService?: IJwtService;
  generateSeasonCalendar?: GenerateSeasonCalendar;
  getMatchById?: GetMatchById;
  updateMatchScore?: UpdateMatchScore;
  updateMatchStatus?: UpdateMatchStatus;
}

/**
 * Plugin HTTP para las rutas de Matches.
 *
 * - POST /seasons/:seasonId/calendar/generate -> Generar calendario de temporada (ADMIN)
 * - PATCH /matches/:matchId/score -> Actualizar marcador de partido (ADMIN)
 * - GET /seasons/:seasonId/matches -> Listar partidos de temporada (paginado + filtro round)
 */
export async function matchesRoutes(
  server: FastifyInstance,
  options: MatchesRoutesOptions = {},
): Promise<void> {
  const zodServer = server.withTypeProvider<ZodTypeProvider>();
  const requireAdmin = createRequireAdmin(options.jwtService ?? server.container.cradle.jwtService);
  const resolveGenerateSeasonCalendar = (request: FastifyRequest): GenerateSeasonCalendar =>
    options.generateSeasonCalendar ??
    (options.repository && options.rosterRepository && options.seasonRepository
      ? new GenerateSeasonCalendar(
          options.repository,
          options.rosterRepository,
          options.seasonRepository,
        )
      : request.container.cradle.generateSeasonCalendar);
  const resolveUpdateMatchScore = (request: FastifyRequest): UpdateMatchScore =>
    options.updateMatchScore ??
    (options.repository
      ? new UpdateMatchScore(options.repository)
      : request.container.cradle.updateMatchScore);
  const resolveGetMatchById = (request: FastifyRequest): GetMatchById =>
    options.getMatchById ??
    (options.repository
      ? new GetMatchById(options.repository)
      : request.container.cradle.getMatchById);
  const resolveUpdateMatchStatus = (request: FastifyRequest): UpdateMatchStatus =>
    options.updateMatchStatus ??
    (options.repository
      ? new UpdateMatchStatus(options.repository)
      : request.container.cradle.updateMatchStatus);

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
  zodServer.post(
    '/seasons/:seasonId/calendar/generate',
    {
      preHandler: [requireAdmin],
      schema: {
        params: generateSeasonCalendarParamsSchema,
        body: generateSeasonCalendarBodySchema,
        response: {
          201: generateSeasonCalendarResponseSchema,
          400: httpErrorResponseSchema,
          401: httpErrorResponseSchema,
          403: httpErrorResponseSchema,
          404: httpErrorResponseSchema,
          409: httpErrorResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['matches'],
        summary: 'Generar calendario de temporada',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const generateSeasonCalendar = resolveGenerateSeasonCalendar(request);
        const { seasonId } = request.params as { seasonId: string };
        const body = request.body as GenerateSeasonCalendarBody;
        const result = await generateSeasonCalendar.execute({
          seasonId: SeasonId.fromString(seasonId),
          ...(body?.startDate ? { startDate: new Date(body.startDate) } : {}),
        });
        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          return reply
            .code(statusCode as 400 | 401 | 403 | 404 | 409 | 500)
            .send({ message });
        }
        return reply.code(201).send({ matchesCount: result.value.length });
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        return reply
          .code(statusCode as 400 | 401 | 403 | 404 | 409 | 500)
          .send({ message });
      }
    },
  );

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
  zodServer.patch(
    '/matches/:matchId/score',
    {
      preHandler: [requireAdmin],
      schema: {
        params: updateMatchScoreParamsSchema,
        body: updateMatchScoreBodySchema,
        response: {
          200: updateMatchScoreResponseSchema,
          400: httpErrorResponseSchema,
          401: httpErrorResponseSchema,
          403: httpErrorResponseSchema,
          404: httpErrorResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['matches'],
        summary: 'Actualizar resultado de partido',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const updateMatchScore = resolveUpdateMatchScore(request);
        const { matchId } = request.params as { matchId: string };
        const body = request.body as UpdateMatchScoreBody;
        const result = await updateMatchScore.execute({
          matchId: MatchId.fromString(matchId),
          homeScore: body.homeScore,
          awayScore: body.awayScore,
        });
        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          return reply.code(statusCode as 400 | 401 | 403 | 404 | 500).send({ message });
        }
        return reply.code(200).send({ matchId: result.value.matchId });
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        return reply.code(statusCode as 400 | 401 | 403 | 404 | 500).send({ message });
      }
    },
  );

  /**
   * GET /matches/:matchId
   *
   * Obtiene un partido por identificador.
   * - 200: Partido encontrado
   * - 404: Partido no encontrado
   */
  zodServer.get(
    '/matches/:matchId',
    {
      schema: {
        params: updateMatchScoreParamsSchema,
        response: {
          200: matchResponseSchema,
          400: httpErrorResponseSchema,
          404: httpErrorResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['matches'],
        summary: 'Obtener partido por id',
      },
    },
    async (request, reply) => {
      try {
        const getMatchById = resolveGetMatchById(request);
        const { matchId } = request.params as { matchId: string };
        const result = await getMatchById.execute(MatchId.fromString(matchId));
        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          return reply.code(statusCode as 400 | 404 | 500).send({ message });
        }
        const match = result.value;
        return reply.code(200).send({
          id: match.id!.value,
          seasonId: match.seasonId.value,
          homeTeamSeasonId: match.homeTeamSeasonId.value,
          awayTeamSeasonId: match.awayTeamSeasonId.value,
          homeScore: match.score.home,
          awayScore: match.score.away,
          date: match.date.toISOString(),
          round: match.round,
          status: match.status,
        });
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        return reply.code(statusCode as 400 | 404 | 500).send({ message });
      }
    },
  );

  /**
   * PATCH /matches/:matchId/status
   *
   * Actualiza el estado operativo del partido.
   * - 200: Estado actualizado
   * - 401: Token ausente o inválido
   * - 403: Usuario no admin
   * - 404: Partido no encontrado
   */
  zodServer.patch(
    '/matches/:matchId/status',
    {
      preHandler: [requireAdmin],
      schema: {
        params: updateMatchScoreParamsSchema,
        body: updateMatchStatusBodySchema,
        response: {
          200: updateMatchScoreResponseSchema,
          400: httpErrorResponseSchema,
          401: httpErrorResponseSchema,
          403: httpErrorResponseSchema,
          404: httpErrorResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['matches'],
        summary: 'Actualizar estado de partido',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const updateMatchStatus = resolveUpdateMatchStatus(request);
        const { matchId } = request.params as { matchId: string };
        const body = request.body as UpdateMatchStatusBody;
        const result = await updateMatchStatus.execute({
          matchId: MatchId.fromString(matchId),
          status: body.status as MatchStatus.POSTPONED | MatchStatus.CANCELLED,
        });
        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          return reply.code(statusCode as 400 | 401 | 403 | 404 | 500).send({ message });
        }
        return reply.code(200).send({ matchId: result.value.matchId });
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        return reply.code(statusCode as 400 | 401 | 403 | 404 | 500).send({ message });
      }
    },
  );

  /**
   * GET /seasons/:seasonId/matches
   *
   * Lista los partidos de una temporada con paginación y filtro opcional por jornada.
   * - 200: Listado paginado
   * - 400: Parámetros inválidos
   * - público (sin autenticación)
   * - 500: Error inesperado
   */
  zodServer.get(
    '/seasons/:seasonId/matches',
    {
      schema: {
        params: generateSeasonCalendarParamsSchema,
        querystring: listSeasonMatchesQuerySchema,
        response: {
          200: listSeasonMatchesResponseSchema,
          400: httpErrorResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['matches'],
        summary: 'Listar partidos de temporada',
      },
    },
    async (request, reply) => {
      try {
        const { seasonId } = request.params as { seasonId: string };
        const query = request.query as { page: number; limit: number; round?: number };
        const repository: IMatchRepository =
          options.repository ?? request.container.cradle.matchRepository;
        const result = await repository.findBySeasonId(SeasonId.fromString(seasonId), query);
        return reply.code(200).send({
          data: result.data.map((match) => ({
            id: match.id!.value,
            seasonId: match.seasonId.value,
            homeTeamSeasonId: match.homeTeamSeasonId.value,
            awayTeamSeasonId: match.awayTeamSeasonId.value,
            homeScore: match.score.home,
            awayScore: match.score.away,
            date: match.date.toISOString(),
            round: match.round,
            status: match.status,
          })),
          meta: {
            total: result.total,
            page: query.page,
            lastPage: computeLastPage(result.total, query.limit),
          },
        });
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        return reply.code(statusCode as 400 | 500).send({ message });
      }
    },
  );
}
