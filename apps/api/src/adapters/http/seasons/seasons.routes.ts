import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
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
  type CreateSeasonBody,
} from './schemas';

interface SeasonsRoutesOptions extends FastifyPluginOptions {
  repository: ISeasonRepository;
  leagueRepository: ILeagueRepository;
  teamRepository: ITeamRepository;
  jwtService: IJwtService;
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
  options: SeasonsRoutesOptions,
): Promise<void> {
  const zodServer = server.withTypeProvider<ZodTypeProvider>();
  const requireAdmin = createRequireAdmin(options.jwtService);
  const createSeason = new CreateSeason(options.repository, options.leagueRepository);
  const listSeasons = new ListSeasons(options.repository);
  const getSeasonById = new GetSeasonById(options.repository);
  const setSeasonWinners = new SetSeasonWinners(
    options.repository,
    options.teamRepository,
  );

  zodServer.post(
    '/seasons',
    { preHandler: [requireAdmin], schema: { body: createSeasonBodySchema } },
    async (request, reply) => {
      try {
        const body = request.body as CreateSeasonBody;
        const result = await createSeason.execute({
          year: body.year,
          leagueId: LeagueId.fromString(body.leagueId),
        });
        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          return reply.code(statusCode).send({ message });
        }
        return reply.code(201).send(toSeasonResponse(result.value));
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        return reply.code(statusCode).send({ message });
      }
    },
  );

  zodServer.get('/seasons', async (_request, reply) => {
    try {
      const result = await listSeasons.execute();
      if (!result.ok) {
        const { statusCode, message } = mapDomainErrorToHttp(result.error);
        return reply.code(statusCode).send({ message });
      }
      return reply.code(200).send(result.value.map(toSeasonResponse));
    } catch (error) {
      const { statusCode, message } = mapDomainErrorToHttp(error);
      return reply.code(statusCode).send({ message });
    }
  });

  zodServer.get(
    '/seasons/:seasonId',
    { schema: { params: getSeasonByIdParamsSchema } },
    async (request, reply) => {
      try {
        const { seasonId: rawId } = request.params as { seasonId: string };
        const result = await getSeasonById.execute(SeasonId.fromString(rawId));
        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          return reply.code(statusCode).send({ message });
        }
        return reply.code(200).send(toSeasonResponse(result.value));
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        return reply.code(statusCode).send({ message });
      }
    },
  );

  zodServer.patch(
    '/seasons/:seasonId/winners',
    {
      preHandler: [requireAdmin],
      schema: { params: getSeasonByIdParamsSchema, body: setSeasonWinnersBodySchema },
    },
    async (request, reply) => {
      try {
        const { seasonId: rawId } = request.params as { seasonId: string };
        const body = request.body as { championId: string; secondId: string };
        const result = await setSeasonWinners.execute({
          seasonId: SeasonId.fromString(rawId),
          championId: TeamId.fromString(body.championId),
          secondId: TeamId.fromString(body.secondId),
        });
        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          return reply.code(statusCode).send({ message });
        }
        return reply.code(200).send(toSeasonResponse(result.value));
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        return reply.code(statusCode).send({ message });
      }
    },
  );
}
