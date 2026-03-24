import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { ITeamRepository } from '@/application/ports/teams/Team.repository';
import type { IJwtService } from '@/application/ports/auth/JwtService.port';
import { CreateTeam } from '@/application/use-cases/teams/CreateTeam.use-case';
import { UpdateTeam } from '@/application/use-cases/teams/UpdateTeam.use-case';
import { DeleteTeam } from '@/application/use-cases/teams/DeleteTeam.use-case';
import { ListTeams } from '@/application/use-cases/teams/ListTeams.use-case';
import { GetTeamByName } from '@/application/use-cases/teams/GetTeamByName.use-case';
import { TeamId } from '@/domain/teams/TeamId.value-object';
import type { Team } from '@/domain/teams/Team.entity';
import { mapDomainErrorToHttp } from '@/adapters/http/http-error-mapper';
import { createRequireAdmin } from '@/adapters/http/auth/auth-plugin';
import {
  createTeamBodySchema,
  updateTeamBodySchema,
  getTeamByIdParamsSchema,
  getTeamByNameParamsSchema,
  type CreateTeamBody,
  type UpdateTeamBody,
} from './schemas';

interface TeamsRoutesOptions extends FastifyPluginOptions {
  repository: ITeamRepository;
  jwtService: IJwtService;
}

interface TeamResponse {
  id: string | null;
  name: string;
  createdAt: string;
}

function toTeamResponse(team: Team): TeamResponse {
  return {
    id: team.id?.value ?? null,
    name: team.name,
    createdAt: team.createdAt.toISOString(),
  };
}

export async function teamsRoutes(
  server: FastifyInstance,
  options: TeamsRoutesOptions,
): Promise<void> {
  const zodServer = server.withTypeProvider<ZodTypeProvider>();
  const requireAdmin = createRequireAdmin(options.jwtService);
  const createTeam = new CreateTeam(options.repository);
  const updateTeam = new UpdateTeam(options.repository);
  const deleteTeam = new DeleteTeam(options.repository);
  const listTeams = new ListTeams(options.repository);
  const getTeamByName = new GetTeamByName(options.repository);

  zodServer.post(
    '/teams',
    { preHandler: [requireAdmin], schema: { body: createTeamBodySchema } },
    async (request, reply) => {
      try {
        const body = request.body as CreateTeamBody;
        const result = await createTeam.execute({ name: body.name });
        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          return reply.code(statusCode).send({ message });
        }
        return reply.code(201).send(toTeamResponse(result.value));
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        return reply.code(statusCode).send({ message });
      }
    },
  );

  zodServer.get('/teams', async (_request, reply) => {
    try {
      const result = await listTeams.execute();
      if (!result.ok) {
        const { statusCode, message } = mapDomainErrorToHttp(result.error);
        return reply.code(statusCode).send({ message });
      }
      return reply.code(200).send(result.value.map(toTeamResponse));
    } catch (error) {
      const { statusCode, message } = mapDomainErrorToHttp(error);
      return reply.code(statusCode).send({ message });
    }
  });

  zodServer.get(
    '/teams/by-name/:name',
    { schema: { params: getTeamByNameParamsSchema } },
    async (request, reply) => {
      try {
        const { name } = request.params as { name: string };
        const result = await getTeamByName.execute(decodeURIComponent(name));
        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          return reply.code(statusCode).send({ message });
        }
        return reply.code(200).send(toTeamResponse(result.value));
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        return reply.code(statusCode).send({ message });
      }
    },
  );

  zodServer.patch(
    '/teams/:teamId',
    {
      preHandler: [requireAdmin],
      schema: { params: getTeamByIdParamsSchema, body: updateTeamBodySchema },
    },
    async (request, reply) => {
      try {
        const { teamId: rawId } = request.params as { teamId: string };
        const body = request.body as UpdateTeamBody;
        const teamId = TeamId.fromString(rawId);
        const result = await updateTeam.execute({
          id: teamId,
          name: body.name,
        });
        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          return reply.code(statusCode).send({ message });
        }
        return reply.code(200).send(toTeamResponse(result.value));
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        return reply.code(statusCode).send({ message });
      }
    },
  );

  zodServer.delete(
    '/teams/:teamId',
    { preHandler: [requireAdmin], schema: { params: getTeamByIdParamsSchema } },
    async (request, reply) => {
      try {
        const { teamId: rawId } = request.params as { teamId: string };
        const teamId = TeamId.fromString(rawId);
        const result = await deleteTeam.execute(teamId);
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
