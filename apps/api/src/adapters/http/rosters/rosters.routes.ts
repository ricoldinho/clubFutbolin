import type { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { IRosterRepository } from '@/application/ports/rosters/Roster.repository';
import type { ITeamRepository } from '@/application/ports/teams/Team.repository';
import type { ISeasonRepository } from '@/application/ports/seasons/Season.repository';
import type { IJwtService } from '@/application/ports/auth/JwtService.port';
import { RegisterTeamToSeason } from '@/application/use-cases/rosters/RegisterTeamToSeason.use-case';
import { AddPlayerToRoster } from '@/application/use-cases/rosters/AddPlayerToRoster.use-case';
import { RemovePlayerFromRoster } from '@/application/use-cases/rosters/RemovePlayerFromRoster.use-case';
import { TeamSeasonId } from '@/domain/rosters/TeamSeasonId.value-object';
import { TeamId } from '@/domain/teams/TeamId.value-object';
import { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';
import { parsePosition } from '@/domain/rosters/Position';
import { mapDomainErrorToHttp } from '@/adapters/http/http-error-mapper';
import { createRequireAdmin } from '@/adapters/http/auth/auth-plugin';
import {
  registerTeamToSeasonBodySchema,
  addPlayerToRosterBodySchema,
  removePlayerFromRosterParamsSchema,
  getRosterParamsSchema,
  registerTeamToSeasonResponseSchema,
  addPlayerToRosterResponseSchema,
  removePlayerFromRosterResponseSchema,
  type RegisterTeamToSeasonBody,
  type AddPlayerToRosterBody,
} from './schemas';
import { httpErrorResponseSchema } from '@/adapters/http/http-response-schemas';

interface RostersRoutesOptions extends FastifyPluginOptions {
  repository?: IRosterRepository;
  teamRepository?: ITeamRepository;
  seasonRepository?: ISeasonRepository;
  jwtService?: IJwtService;
  registerTeamToSeason?: RegisterTeamToSeason;
  addPlayerToRoster?: AddPlayerToRoster;
  removePlayerFromRoster?: RemovePlayerFromRoster;
}

export async function rostersRoutes(
  server: FastifyInstance,
  options: RostersRoutesOptions = {},
): Promise<void> {
  const zodServer = server.withTypeProvider<ZodTypeProvider>();
  const requireAdmin = createRequireAdmin(options.jwtService ?? server.container.cradle.jwtService);
  const resolveRegisterTeamToSeason = (request: FastifyRequest): RegisterTeamToSeason =>
    options.registerTeamToSeason ??
    (options.repository && options.teamRepository && options.seasonRepository
      ? new RegisterTeamToSeason(
          options.repository,
          options.teamRepository,
          options.seasonRepository,
        )
      : request.container.cradle.registerTeamToSeason);

  const resolveAddPlayerToRoster = (request: FastifyRequest): AddPlayerToRoster =>
    options.addPlayerToRoster ??
    (options.repository
      ? new AddPlayerToRoster(options.repository)
      : request.container.cradle.addPlayerToRoster);

  const resolveRemovePlayerFromRoster = (request: FastifyRequest): RemovePlayerFromRoster =>
    options.removePlayerFromRoster ??
    (options.repository
      ? new RemovePlayerFromRoster(options.repository)
      : request.container.cradle.removePlayerFromRoster);

  zodServer.post(
    '/rosters/register',
    {
      preHandler: [requireAdmin],
      schema: {
        body: registerTeamToSeasonBodySchema,
        response: {
          201: registerTeamToSeasonResponseSchema,
          400: httpErrorResponseSchema,
          401: httpErrorResponseSchema,
          403: httpErrorResponseSchema,
          404: httpErrorResponseSchema,
          409: httpErrorResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['rosters'],
        summary: 'Inscribir equipo en temporada',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const registerTeamToSeason = resolveRegisterTeamToSeason(request);
        const body = request.body as RegisterTeamToSeasonBody;
        const result = await registerTeamToSeason.execute({
          teamId: TeamId.fromString(body.teamId),
          seasonId: SeasonId.fromString(body.seasonId),
        });
        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          return reply
            .code(statusCode as 400 | 401 | 403 | 404 | 409 | 500)
            .send({ message });
        }
        return reply.code(201).send({
          teamSeasonId: result.value.teamSeasonId.value,
          teamId: result.value.teamId.value,
          seasonId: result.value.seasonId.value,
          membersCount: result.value.members.length,
        });
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        return reply
          .code(statusCode as 400 | 401 | 403 | 404 | 409 | 500)
          .send({ message });
      }
    },
  );

  zodServer.post(
    '/rosters/:teamSeasonId/players',
    {
      preHandler: [requireAdmin],
      schema: {
        params: getRosterParamsSchema,
        body: addPlayerToRosterBodySchema,
        response: {
          200: addPlayerToRosterResponseSchema,
          400: httpErrorResponseSchema,
          401: httpErrorResponseSchema,
          403: httpErrorResponseSchema,
          404: httpErrorResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['rosters'],
        summary: 'Añadir jugador al roster',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const addPlayerToRoster = resolveAddPlayerToRoster(request);
        const { teamSeasonId: rawId } = request.params as { teamSeasonId: string };
        const body = request.body as AddPlayerToRosterBody;
        const result = await addPlayerToRoster.execute({
          teamSeasonId: TeamSeasonId.fromString(rawId),
          playerId: PlayerId.fromString(body.playerId),
          position: parsePosition(body.position),
        });
        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          return reply
            .code(statusCode as 400 | 401 | 403 | 404 | 500)
            .send({ message });
        }
        return reply.code(200).send({ membersCount: result.value.members.length });
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        return reply
          .code(statusCode as 400 | 401 | 403 | 404 | 500)
          .send({ message });
      }
    },
  );

  zodServer.delete(
    '/rosters/:teamSeasonId/players/:playerId',
    {
      preHandler: [requireAdmin],
      schema: {
        params: removePlayerFromRosterParamsSchema,
        response: {
          200: removePlayerFromRosterResponseSchema,
          400: httpErrorResponseSchema,
          401: httpErrorResponseSchema,
          403: httpErrorResponseSchema,
          404: httpErrorResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['rosters'],
        summary: 'Eliminar jugador del roster',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const removePlayerFromRoster = resolveRemovePlayerFromRoster(request);
        const { teamSeasonId: rawTsId, playerId: rawPlayerId } = request.params as {
          teamSeasonId: string;
          playerId: string;
        };
        const result = await removePlayerFromRoster.execute({
          teamSeasonId: TeamSeasonId.fromString(rawTsId),
          playerId: PlayerId.fromString(rawPlayerId),
        });
        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          return reply
            .code(statusCode as 400 | 401 | 403 | 404 | 500)
            .send({ message });
        }
        return reply.code(200).send({ membersCount: result.value.members.length });
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        return reply
          .code(statusCode as 400 | 401 | 403 | 404 | 500)
          .send({ message });
      }
    },
  );
}
