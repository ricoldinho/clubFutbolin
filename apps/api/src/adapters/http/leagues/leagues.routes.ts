import { z } from 'zod';
import type { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { ILeagueRepository } from '@/application/ports/leagues/League.repository';
import type { ISeasonRepository } from '@/application/ports/seasons/Season.repository';
import type { IRosterRepository } from '@/application/ports/rosters/Roster.repository';
import type { ITeamRepository } from '@/application/ports/teams/Team.repository';
import type { IJwtService } from '@/application/ports/auth/JwtService.port';
import { CreateLeague } from '@/application/use-cases/leagues/CreateLeague.use-case';
import { UpdateLeague } from '@/application/use-cases/leagues/UpdateLeague.use-case';
import { DeleteLeague } from '@/application/use-cases/leagues/DeleteLeague.use-case';
import { ListLeagues } from '@/application/use-cases/leagues/ListLeagues.use-case';
import { GetLeagueById } from '@/application/use-cases/leagues/GetLeagueById.use-case';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import { parseLeagueCategory } from '@/domain/leagues/LeagueCategory';
import type { League } from '@/domain/leagues/League.entity';
import { mapDomainErrorToHttp } from '@/adapters/http/http-error-mapper';
import { createRequireAdmin } from '@/adapters/http/auth/auth-plugin';
import {
  createLeagueBodySchema,
  updateLeagueBodySchema,
  getLeagueByIdParamsSchema,
  listLeaguesQuerySchema,
  listLeaguesResponseSchema,
  leagueSeasonsResponseSchema,
  seasonTeamsByCategoryResponseSchema,
  leagueResponseSchema,
  type CreateLeagueBody,
  type UpdateLeagueBody,
} from './schemas';
import { computeLastPage } from '@/shared/pagination';
import { httpErrorResponseSchema } from '@/adapters/http/http-response-schemas';

interface LeaguesRoutesOptions extends FastifyPluginOptions {
  repository?: ILeagueRepository;
  seasonRepository?: ISeasonRepository;
  rosterRepository?: IRosterRepository;
  teamRepository?: ITeamRepository;
  jwtService?: IJwtService;
  createLeague?: CreateLeague;
  updateLeague?: UpdateLeague;
  deleteLeague?: DeleteLeague;
  listLeagues?: ListLeagues;
  getLeagueById?: GetLeagueById;
}

interface LeagueResponse {
  id: string | null;
  name: string;
  leagueCategory: string;
}

function toLeagueResponse(league: League): LeagueResponse {
  return {
    id: league.id?.value ?? null,
    name: league.name,
    leagueCategory: league.leagueCategory,
  };
}

export async function leaguesRoutes(
  server: FastifyInstance,
  options: LeaguesRoutesOptions = {},
): Promise<void> {
  const zodServer = server.withTypeProvider<ZodTypeProvider>();
  const requireAdmin = createRequireAdmin(options.jwtService ?? server.container.cradle.jwtService);
  const resolveCreateLeague = (request: FastifyRequest): CreateLeague =>
    options.createLeague ??
    (options.repository
      ? new CreateLeague(options.repository)
      : request.container.cradle.createLeague);

  const resolveUpdateLeague = (request: FastifyRequest): UpdateLeague =>
    options.updateLeague ??
    (options.repository
      ? new UpdateLeague(options.repository)
      : request.container.cradle.updateLeague);

  const resolveDeleteLeague = (request: FastifyRequest): DeleteLeague =>
    options.deleteLeague ??
    (options.repository
      ? new DeleteLeague(options.repository)
      : request.container.cradle.deleteLeague);

  const resolveListLeagues = (request: FastifyRequest): ListLeagues =>
    options.listLeagues ??
    (options.repository
      ? new ListLeagues(options.repository)
      : request.container.cradle.listLeagues);

  const resolveGetLeagueById = (request: FastifyRequest): GetLeagueById =>
    options.getLeagueById ??
    (options.repository
      ? new GetLeagueById(options.repository)
      : request.container.cradle.getLeagueById);

  const resolveSeasonRepository = (request: FastifyRequest): ISeasonRepository =>
    options.seasonRepository ?? request.container.cradle.seasonRepository;

  const resolveRosterRepository = (request: FastifyRequest): IRosterRepository =>
    options.rosterRepository ?? request.container.cradle.rosterRepository;

  const resolveTeamRepository = (request: FastifyRequest): ITeamRepository =>
    options.teamRepository ?? request.container.cradle.teamRepository;

  zodServer.post(
    '/leagues',
    {
      preHandler: [requireAdmin],
      schema: {
        body: createLeagueBodySchema,
        response: {
          201: leagueResponseSchema,
          400: httpErrorResponseSchema,
          401: httpErrorResponseSchema,
          403: httpErrorResponseSchema,
          409: httpErrorResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['leagues'],
        summary: 'Crear liga',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const createLeague = resolveCreateLeague(request);
        const body = request.body as CreateLeagueBody;
        const result = await createLeague.execute({
          name: body.name,
          leagueCategory: parseLeagueCategory(body.leagueCategory),
        });
        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          return reply
            .code(statusCode as 400 | 401 | 403 | 409 | 500)
            .send({ message });
        }
        return reply.code(201).send(toLeagueResponse(result.value));
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        return reply
          .code(statusCode as 400 | 401 | 403 | 409 | 500)
          .send({ message });
      }
    },
  );

  zodServer.get(
    '/leagues',
    {
      schema: {
        querystring: listLeaguesQuerySchema,
        response: {
          200: listLeaguesResponseSchema,
          400: httpErrorResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['leagues'],
        summary: 'Listar ligas paginadas',
      },
    },
    async (_request, reply) => {
    try {
      const listLeagues = resolveListLeagues(_request);
      const query = _request.query as { page: number; limit: number };
      const result = await listLeagues.execute({
        pagination: { page: query.page, limit: query.limit },
      });
      if (!result.ok) {
        const { statusCode, message } = mapDomainErrorToHttp(result.error);
        return reply
          .code(statusCode as 400 | 500)
          .send({ message });
      }
      return reply.code(200).send({
        data: result.value.data.map(toLeagueResponse),
        meta: {
          total: result.value.total,
          page: query.page,
          lastPage: computeLastPage(result.value.total, query.limit),
        },
      });
    } catch (error) {
      const { statusCode, message } = mapDomainErrorToHttp(error);
      return reply
        .code(statusCode as 400 | 500)
        .send({ message });
    }
    },
  );

  zodServer.get(
    '/leagues/:leagueId/seasons',
    {
      schema: {
        params: getLeagueByIdParamsSchema,
        response: {
          200: leagueSeasonsResponseSchema,
          400: httpErrorResponseSchema,
          404: httpErrorResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['leagues'],
        summary: 'Listar seasons de una liga',
      },
    },
    async (request, reply) => {
      try {
        const leagueId = LeagueId.fromString((request.params as { leagueId: string }).leagueId);
        const league = await (options.repository ?? request.container.cradle.leagueRepository).findById(leagueId);
        if (league === null) {
          return reply.code(404).send({ message: `League with id "${leagueId.value}" not found` });
        }

        const seasons = await resolveSeasonRepository(request).findByLeagueId(leagueId);
        const sorted = [...seasons].sort((a, b) => b.year - a.year);
        return reply.code(200).send({
          data: sorted.map((season) => ({
            id: season.id!.value,
            year: season.year,
            leagueId: season.leagueId.value,
            championId: season.championId?.value ?? null,
            secondId: season.secondId?.value ?? null,
          })),
        });
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        return reply.code(statusCode as 400 | 404 | 500).send({ message });
      }
    },
  );

  zodServer.get(
    '/leagues/:leagueId/seasons/:seasonId/teams-by-category',
    {
      schema: {
        params: getLeagueByIdParamsSchema.extend({
          seasonId: getLeagueByIdParamsSchema.shape.leagueId,
        }),
        response: {
          200: seasonTeamsByCategoryResponseSchema,
          400: httpErrorResponseSchema,
          404: httpErrorResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['leagues'],
        summary: 'Equipos de una season agrupados por categoría',
      },
    },
    async (request, reply) => {
      try {
        const params = request.params as { leagueId: string; seasonId: string };
        const leagueId = LeagueId.fromString(params.leagueId);
        const seasonId = params.seasonId;

        const league = await (options.repository ?? request.container.cradle.leagueRepository).findById(leagueId);
        if (league === null) {
          return reply.code(404).send({ message: `League with id "${leagueId.value}" not found` });
        }

        const season = await resolveSeasonRepository(request).findById(SeasonId.fromString(seasonId));
        if (season === null || !season.leagueId.equals(leagueId)) {
          return reply.code(404).send({ message: 'Season no encontrada para esta liga' });
        }

        const rosters = await resolveRosterRepository(request).findBySeasonId(season.id!);
        const teamRepository = resolveTeamRepository(request);
        const teams = await Promise.all(
          rosters.map(async (roster) => {
            const team = await teamRepository.findById(roster.teamId);
            return team ? { id: team.id!.value, name: team.name } : null;
          }),
        );

        return reply.code(200).send({
          seasonId: season.id!.value,
          categories: [
            {
              category: league.leagueCategory,
              teams: teams.filter((team): team is { id: string; name: string } => team !== null),
            },
          ],
        });
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        return reply.code(statusCode as 400 | 404 | 500).send({ message });
      }
    },
  );

  zodServer.get(
    '/leagues/:leagueId',
    {
      schema: {
        params: getLeagueByIdParamsSchema,
        response: {
          200: leagueResponseSchema,
          400: httpErrorResponseSchema,
          404: httpErrorResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['leagues'],
        summary: 'Obtener liga por id',
      },
    },
    async (request, reply) => {
      try {
        const getLeagueById = resolveGetLeagueById(request);
        const { leagueId: rawId } = request.params as { leagueId: string };
        const leagueId = LeagueId.fromString(rawId);
        const result = await getLeagueById.execute(leagueId);
        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          return reply
            .code(statusCode as 400 | 404 | 500)
            .send({ message });
        }
        return reply.code(200).send(toLeagueResponse(result.value));
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        return reply
          .code(statusCode as 400 | 404 | 500)
          .send({ message });
      }
    },
  );

  zodServer.patch(
    '/leagues/:leagueId',
    {
      preHandler: [requireAdmin],
      schema: {
        params: getLeagueByIdParamsSchema,
        body: updateLeagueBodySchema,
        response: {
          200: leagueResponseSchema,
          400: httpErrorResponseSchema,
          401: httpErrorResponseSchema,
          403: httpErrorResponseSchema,
          404: httpErrorResponseSchema,
          409: httpErrorResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['leagues'],
        summary: 'Actualizar liga',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const updateLeague = resolveUpdateLeague(request);
        const { leagueId: rawId } = request.params as { leagueId: string };
        const body = request.body as UpdateLeagueBody;
        const leagueId = LeagueId.fromString(rawId);
        const result = await updateLeague.execute({
          id: leagueId,
          name: body.name,
          leagueCategory: body.leagueCategory
            ? parseLeagueCategory(body.leagueCategory)
            : undefined,
        });
        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          return reply
            .code(statusCode as 400 | 401 | 403 | 404 | 409 | 500)
            .send({ message });
        }
        return reply.code(200).send(toLeagueResponse(result.value));
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        return reply
          .code(statusCode as 400 | 401 | 403 | 404 | 409 | 500)
          .send({ message });
      }
    },
  );

  zodServer.delete(
    '/leagues/:leagueId',
    {
      preHandler: [requireAdmin],
      schema: {
        params: getLeagueByIdParamsSchema,
        response: {
          204: z.any(),
          400: httpErrorResponseSchema,
          401: httpErrorResponseSchema,
          403: httpErrorResponseSchema,
          404: httpErrorResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['leagues'],
        summary: 'Eliminar liga',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const deleteLeague = resolveDeleteLeague(request);
        const { leagueId: rawId } = request.params as { leagueId: string };
        const leagueId = LeagueId.fromString(rawId);
        const result = await deleteLeague.execute(leagueId);
        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          return reply
            .code(statusCode as 400 | 401 | 403 | 404 | 500)
            .send({ message });
        }
        return reply.code(204).send();
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        return reply
          .code(statusCode as 400 | 401 | 403 | 404 | 500)
          .send({ message });
      }
    },
  );
}
