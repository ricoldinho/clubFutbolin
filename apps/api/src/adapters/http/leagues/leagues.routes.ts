import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { ILeagueRepository } from '@/application/ports/leagues/League.repository';
import type { IJwtService } from '@/application/ports/auth/JwtService.port';
import { CreateLeague } from '@/application/use-cases/leagues/CreateLeague.use-case';
import { UpdateLeague } from '@/application/use-cases/leagues/UpdateLeague.use-case';
import { DeleteLeague } from '@/application/use-cases/leagues/DeleteLeague.use-case';
import { ListLeagues } from '@/application/use-cases/leagues/ListLeagues.use-case';
import { GetLeagueById } from '@/application/use-cases/leagues/GetLeagueById.use-case';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import { parseLeagueCategory } from '@/domain/leagues/LeagueCategory';
import type { League } from '@/domain/leagues/League.entity';
import { mapDomainErrorToHttp } from '@/adapters/http/http-error-mapper';
import { createRequireAdmin } from '@/adapters/http/auth/auth-plugin';
import {
  createLeagueBodySchema,
  updateLeagueBodySchema,
  getLeagueByIdParamsSchema,
  type CreateLeagueBody,
  type UpdateLeagueBody,
} from './schemas';

interface LeaguesRoutesOptions extends FastifyPluginOptions {
  repository: ILeagueRepository;
  jwtService: IJwtService;
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
  options: LeaguesRoutesOptions,
): Promise<void> {
  const zodServer = server.withTypeProvider<ZodTypeProvider>();
  const requireAdmin = createRequireAdmin(options.jwtService);
  const createLeague = new CreateLeague(options.repository);
  const updateLeague = new UpdateLeague(options.repository);
  const deleteLeague = new DeleteLeague(options.repository);
  const listLeagues = new ListLeagues(options.repository);
  const getLeagueById = new GetLeagueById(options.repository);

  zodServer.post(
    '/leagues',
    { preHandler: [requireAdmin], schema: { body: createLeagueBodySchema } },
    async (request, reply) => {
      try {
        const body = request.body as CreateLeagueBody;
        const result = await createLeague.execute({
          name: body.name,
          leagueCategory: parseLeagueCategory(body.leagueCategory),
        });
        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          return reply.code(statusCode).send({ message });
        }
        return reply.code(201).send(toLeagueResponse(result.value));
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        return reply.code(statusCode).send({ message });
      }
    },
  );

  zodServer.get('/leagues', async (_request, reply) => {
    try {
      const result = await listLeagues.execute();
      if (!result.ok) {
        const { statusCode, message } = mapDomainErrorToHttp(result.error);
        return reply.code(statusCode).send({ message });
      }
      return reply.code(200).send(result.value.map(toLeagueResponse));
    } catch (error) {
      const { statusCode, message } = mapDomainErrorToHttp(error);
      return reply.code(statusCode).send({ message });
    }
  });

  zodServer.get(
    '/leagues/:leagueId',
    { schema: { params: getLeagueByIdParamsSchema } },
    async (request, reply) => {
      try {
        const { leagueId: rawId } = request.params as { leagueId: string };
        const leagueId = LeagueId.fromString(rawId);
        const result = await getLeagueById.execute(leagueId);
        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          return reply.code(statusCode).send({ message });
        }
        return reply.code(200).send(toLeagueResponse(result.value));
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        return reply.code(statusCode).send({ message });
      }
    },
  );

  zodServer.patch(
    '/leagues/:leagueId',
    {
      preHandler: [requireAdmin],
      schema: { params: getLeagueByIdParamsSchema, body: updateLeagueBodySchema },
    },
    async (request, reply) => {
      try {
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
          return reply.code(statusCode).send({ message });
        }
        return reply.code(200).send(toLeagueResponse(result.value));
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        return reply.code(statusCode).send({ message });
      }
    },
  );

  zodServer.delete(
    '/leagues/:leagueId',
    {
      preHandler: [requireAdmin],
      schema: { params: getLeagueByIdParamsSchema },
    },
    async (request, reply) => {
      try {
        const { leagueId: rawId } = request.params as { leagueId: string };
        const leagueId = LeagueId.fromString(rawId);
        const result = await deleteLeague.execute(leagueId);
        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          return reply.code(statusCode).send({ message });
        }
        return reply.code(204).send();
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        return reply.code(statusCode).send({ message });
      }
    },
  );
}
