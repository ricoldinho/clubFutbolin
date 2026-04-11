import { z } from 'zod';
import type { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { ITeamRepository } from '@/application/ports/teams/Team.repository';
import type { IRosterRepository } from '@/application/ports/rosters/Roster.repository';
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
  listTeamsQuerySchema,
  type ListTeamsQuery,
  listTeamsResponseSchema,
  teamProfileResponseSchema,
  teamResponseSchema,
  type CreateTeamBody,
  type UpdateTeamBody,
} from './schemas';
import { computeLastPage } from '@/shared/pagination';
import { httpErrorResponseSchema } from '@/adapters/http/http-response-schemas';

interface TeamsRoutesOptions extends FastifyPluginOptions {
  repository?: ITeamRepository;
  rosterRepository?: IRosterRepository;
  jwtService?: IJwtService;
  createTeam?: CreateTeam;
  updateTeam?: UpdateTeam;
  deleteTeam?: DeleteTeam;
  listTeams?: ListTeams;
  getTeamByName?: GetTeamByName;
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
  options: TeamsRoutesOptions = {},
): Promise<void> {
  const zodServer = server.withTypeProvider<ZodTypeProvider>();
  const requireAdmin = createRequireAdmin(options.jwtService ?? server.container.cradle.jwtService);
  const resolveCreateTeam = (request: FastifyRequest): CreateTeam =>
    options.createTeam ?? request.container.cradle.createTeam;

  const resolveUpdateTeam = (request: FastifyRequest): UpdateTeam =>
    options.updateTeam ??
    (options.repository
      ? new UpdateTeam(options.repository)
      : request.container.cradle.updateTeam);

  const resolveDeleteTeam = (request: FastifyRequest): DeleteTeam =>
    options.deleteTeam ??
    (options.repository
      ? new DeleteTeam(options.repository)
      : request.container.cradle.deleteTeam);

  const resolveListTeams = (request: FastifyRequest): ListTeams =>
    options.listTeams ??
    (options.repository
      ? new ListTeams(options.repository)
      : request.container.cradle.listTeams);

  const resolveGetTeamByName = (request: FastifyRequest): GetTeamByName =>
    options.getTeamByName ??
    (options.repository
      ? new GetTeamByName(options.repository)
      : request.container.cradle.getTeamByName);

  const resolveRosterRepository = (request: FastifyRequest): IRosterRepository =>
    options.rosterRepository ?? request.container.cradle.rosterRepository;

  /**
   * POST /teams
   *
   * Crea un equipo e inscribe la plantilla inicial (2–4 jugadores) en la temporada
   * con el año más alto registrado en el sistema.
   * - 201: Equipo creado
   * - 400: Validación (p. ej. menos de 2 jugadores) o aún no hay temporadas
   * - 404: Algún `playerId` no existe
   * - 409: Nombre de equipo duplicado
   */
  zodServer.post(
    '/teams',
    {
      preHandler: [requireAdmin],
      schema: {
        body: createTeamBodySchema,
        response: {
          201: teamResponseSchema,
          400: httpErrorResponseSchema,
          401: httpErrorResponseSchema,
          403: httpErrorResponseSchema,
          404: httpErrorResponseSchema,
          409: httpErrorResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['teams'],
        summary: 'Crear equipo',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const createTeam = resolveCreateTeam(request);
        const body = request.body as CreateTeamBody;
        const result = await createTeam.execute({ name: body.name, playerIds: body.playerIds });
        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          return reply
            .code(statusCode as 400 | 401 | 403 | 404 | 409 | 500)
            .send({ message });
        }
        return reply.code(201).send(toTeamResponse(result.value));
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        return reply
          .code(statusCode as 400 | 401 | 403 | 404 | 409 | 500)
          .send({ message });
      }
    },
  );

  zodServer.get(
    '/teams',
    {
      schema: {
        querystring: listTeamsQuerySchema,
        response: {
          200: listTeamsResponseSchema,
          400: httpErrorResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['teams'],
        summary: 'Listar equipos paginados',
        description:
          'Lista paginada. El parámetro opcional `q` filtra por coincidencia parcial en el nombre (sin distinguir mayúsculas).',
      },
    },
    async (_request, reply) => {
      try {
        const listTeams = resolveListTeams(_request);
        const query = _request.query as ListTeamsQuery;
        const result = await listTeams.execute({
          pagination: { page: query.page, limit: query.limit },
          searchQuery: query.q,
        });
        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          return reply
            .code(statusCode as 400 | 500)
            .send({ message });
        }
        return reply.code(200).send({
          data: result.value.data.map(toTeamResponse),
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

  /**
   * GET /teams/:teamId/profile
   *
   * Devuelve información del equipo, ligas/temporadas en las que participa
   * y jugadores que lo integran.
   */
  zodServer.get(
    '/teams/:teamId/profile',
    {
      schema: {
        params: getTeamByIdParamsSchema,
        response: {
          200: teamProfileResponseSchema,
          400: httpErrorResponseSchema,
          404: httpErrorResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['teams'],
        summary: 'Obtener perfil de equipo',
      },
    },
    async (request, reply) => {
      try {
        const teamId = TeamId.fromString((request.params as { teamId: string }).teamId);
        const teamRepository = options.repository ?? request.container.cradle.teamRepository;
        const team = await teamRepository.findById(teamId);
        if (team === null) {
          return reply.code(404).send({ message: `Team with id "${teamId.value}" not found` });
        }

        const rosterRepository = resolveRosterRepository(request);
        const [memberships, players] = await Promise.all([
          rosterRepository.findMembershipsByTeamId(teamId),
          rosterRepository.findPlayersByTeamId(teamId),
        ]);

        return reply.code(200).send({
          team: toTeamResponse(team),
          leagues: memberships.map((membership) => ({
            id: membership.leagueId,
            name: membership.leagueName,
            leagueCategory: membership.leagueCategory,
            seasonId: membership.seasonId.value,
            seasonYear: membership.seasonYear,
          })),
          players,
        });
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        return reply.code(statusCode as 400 | 404 | 500).send({ message });
      }
    },
  );

  zodServer.get(
    '/teams/by-name/:name',
    {
      schema: {
        params: getTeamByNameParamsSchema,
        response: {
          200: teamResponseSchema,
          400: httpErrorResponseSchema,
          404: httpErrorResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['teams'],
        summary: 'Obtener equipo por nombre',
      },
    },
    async (request, reply) => {
      try {
        const getTeamByName = resolveGetTeamByName(request);
        const { name } = request.params as { name: string };
        const result = await getTeamByName.execute(decodeURIComponent(name));
        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          return reply.code(statusCode as 400 | 404 | 500).send({ message });
        }
        return reply.code(200).send(toTeamResponse(result.value));
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        return reply.code(statusCode as 400 | 404 | 500).send({ message });
      }
    },
  );

  zodServer.patch(
    '/teams/:teamId',
    {
      preHandler: [requireAdmin],
      schema: {
        params: getTeamByIdParamsSchema,
        body: updateTeamBodySchema,
        response: {
          200: teamResponseSchema,
          400: httpErrorResponseSchema,
          401: httpErrorResponseSchema,
          403: httpErrorResponseSchema,
          404: httpErrorResponseSchema,
          409: httpErrorResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['teams'],
        summary: 'Actualizar equipo',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const updateTeam = resolveUpdateTeam(request);
        const { teamId: rawId } = request.params as { teamId: string };
        const body = request.body as UpdateTeamBody;
        const teamId = TeamId.fromString(rawId);
        const result = await updateTeam.execute({
          id: teamId,
          name: body.name,
        });
        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          return reply
            .code(statusCode as 400 | 401 | 403 | 404 | 409 | 500)
            .send({ message });
        }
        return reply.code(200).send(toTeamResponse(result.value));
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        return reply
          .code(statusCode as 400 | 401 | 403 | 404 | 409 | 500)
          .send({ message });
      }
    },
  );

  zodServer.delete(
    '/teams/:teamId',
    {
      preHandler: [requireAdmin],
      schema: {
        params: getTeamByIdParamsSchema,
        response: {
          204: z.any(),
          400: httpErrorResponseSchema,
          401: httpErrorResponseSchema,
          403: httpErrorResponseSchema,
          404: httpErrorResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['teams'],
        summary: 'Eliminar equipo',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const deleteTeam = resolveDeleteTeam(request);
        const { teamId: rawId } = request.params as { teamId: string };
        const teamId = TeamId.fromString(rawId);
        const result = await deleteTeam.execute(teamId);
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
