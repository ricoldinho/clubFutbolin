import type { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { ISeasonRepository } from '@/application/ports/seasons/Season.repository';
import type { ILeagueRepository } from '@/application/ports/leagues/League.repository';
import type { ITeamRepository } from '@/application/ports/teams/Team.repository';
import type { IJwtService } from '@/application/ports/auth/JwtService.port';
import { CreateSeason } from '@/application/use-cases/seasons/CreateSeason.use-case';
import { ListSeasons } from '@/application/use-cases/seasons/ListSeasons.use-case';
import { GetSeasonById } from '@/application/use-cases/seasons/GetSeasonById.use-case';
import { SetSeasonWinners } from '@/application/use-cases/seasons/SetSeasonWinners.use-case';
import { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import { TeamId } from '@/domain/teams/TeamId.value-object';
import type { Season } from '@/domain/seasons/Season.entity';
import { mapDomainErrorToHttp } from '@/adapters/http/http-error-mapper';
import { createRequireAdmin } from '@/adapters/http/auth/auth-plugin';
import {
  createSeasonBodySchema,
  setSeasonWinnersBodySchema,
  getSeasonByIdParamsSchema,
  listSeasonsQuerySchema,
  listSeasonsResponseSchema,
  seasonResponseSchema,
  type CreateSeasonBody,
} from './schemas';
import { computeLastPage } from '@/shared/pagination';
import { httpErrorResponseSchema } from '@/adapters/http/http-response-schemas';

interface SeasonsRoutesOptions extends FastifyPluginOptions {
  repository?: ISeasonRepository;
  leagueRepository?: ILeagueRepository;
  teamRepository?: ITeamRepository;
  jwtService?: IJwtService;
  createSeason?: CreateSeason;
  listSeasons?: ListSeasons;
  getSeasonById?: GetSeasonById;
  setSeasonWinners?: SetSeasonWinners;
}

interface SeasonResponse {
  id: string | null;
  year: number;
  leagueId: string;
  championId: string | null;
  secondId: string | null;
}

function toSeasonResponse(season: Season): SeasonResponse {
  return {
    id: season.id?.value ?? null,
    year: season.year,
    leagueId: season.leagueId.value,
    championId: season.championId?.value ?? null,
    secondId: season.secondId?.value ?? null,
  };
}

export async function seasonsRoutes(
  server: FastifyInstance,
  options: SeasonsRoutesOptions = {},
): Promise<void> {
  const zodServer = server.withTypeProvider<ZodTypeProvider>();
  const requireAdmin = createRequireAdmin(options.jwtService ?? server.container.cradle.jwtService);
  const resolveDeps = (request: FastifyRequest) => ({
    createSeason:
      options.createSeason ??
      (options.repository && options.leagueRepository
        ? new CreateSeason(options.repository, options.leagueRepository)
        : request.container.cradle.createSeason),
    listSeasons:
      options.listSeasons ??
      (options.repository
        ? new ListSeasons(options.repository)
        : request.container.cradle.listSeasons),
    getSeasonById:
      options.getSeasonById ??
      (options.repository
        ? new GetSeasonById(options.repository)
        : request.container.cradle.getSeasonById),
    setSeasonWinners:
      options.setSeasonWinners ??
      (options.repository && options.teamRepository
        ? new SetSeasonWinners(options.repository, options.teamRepository)
        : request.container.cradle.setSeasonWinners),
  });

  zodServer.post(
    '/seasons',
    {
      preHandler: [requireAdmin],
      schema: {
        body: createSeasonBodySchema,
        response: {
          201: seasonResponseSchema,
          400: httpErrorResponseSchema,
          401: httpErrorResponseSchema,
          403: httpErrorResponseSchema,
          404: httpErrorResponseSchema,
          409: httpErrorResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['seasons'],
        summary: 'Crear temporada',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const { createSeason } = resolveDeps(request);
        const body = request.body as CreateSeasonBody;
        const result = await createSeason.execute({
          year: body.year,
          leagueId: LeagueId.fromString(body.leagueId),
        });
        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          return reply
            .code(statusCode as 400 | 401 | 403 | 404 | 409 | 500)
            .send({ message });
        }
        return reply.code(201).send(toSeasonResponse(result.value));
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        return reply
          .code(statusCode as 400 | 401 | 403 | 404 | 409 | 500)
          .send({ message });
      }
    },
  );

  zodServer.get(
    '/seasons',
    {
      schema: {
        querystring: listSeasonsQuerySchema,
        response: {
          200: listSeasonsResponseSchema,
          400: httpErrorResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['seasons'],
        summary: 'Listar temporadas paginadas',
      },
    },
    async (_request, reply) => {
      try {
        const { listSeasons } = resolveDeps(_request);
        const query = _request.query as { page: number; limit: number };
        const result = await listSeasons.execute({
          pagination: { page: query.page, limit: query.limit },
        });
        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          return reply
            .code(statusCode as 400 | 500)
            .send({ message });
        }
        return reply.code(200).send({
          data: result.value.data.map(toSeasonResponse),
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
    '/seasons/:seasonId',
    {
      schema: {
        params: getSeasonByIdParamsSchema,
        response: {
          200: seasonResponseSchema,
          400: httpErrorResponseSchema,
          404: httpErrorResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['seasons'],
        summary: 'Obtener temporada por id',
      },
    },
    async (request, reply) => {
      try {
        const { getSeasonById } = resolveDeps(request);
        const { seasonId: rawId } = request.params as { seasonId: string };
        const result = await getSeasonById.execute(SeasonId.fromString(rawId));
        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          return reply.code(statusCode as 400 | 404 | 500).send({ message });
        }
        return reply.code(200).send(toSeasonResponse(result.value));
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        return reply.code(statusCode as 400 | 404 | 500).send({ message });
      }
    },
  );

  zodServer.patch(
    '/seasons/:seasonId/winners',
    {
      preHandler: [requireAdmin],
      schema: {
        params: getSeasonByIdParamsSchema,
        body: setSeasonWinnersBodySchema,
        response: {
          200: seasonResponseSchema,
          400: httpErrorResponseSchema,
          401: httpErrorResponseSchema,
          403: httpErrorResponseSchema,
          404: httpErrorResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['seasons'],
        summary: 'Actualizar ganadores',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const { setSeasonWinners } = resolveDeps(request);
        const { seasonId: rawId } = request.params as { seasonId: string };
        const body = request.body as { championId: string; secondId: string };
        const result = await setSeasonWinners.execute({
          seasonId: SeasonId.fromString(rawId),
          championId: TeamId.fromString(body.championId),
          secondId: TeamId.fromString(body.secondId),
        });
        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          return reply
            .code(statusCode as 400 | 401 | 403 | 404 | 500)
            .send({ message });
        }
        return reply.code(200).send(toSeasonResponse(result.value));
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        return reply
          .code(statusCode as 400 | 401 | 403 | 404 | 500)
          .send({ message });
      }
    },
  );
}
