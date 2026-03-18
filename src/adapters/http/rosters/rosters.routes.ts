import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
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
  type RegisterTeamToSeasonBody,
  type AddPlayerToRosterBody,
} from './schemas';

interface RostersRoutesOptions extends FastifyPluginOptions {
  repository: IRosterRepository;
  teamRepository: ITeamRepository;
  seasonRepository: ISeasonRepository;
  jwtService: IJwtService;
}

export async function rostersRoutes(
  server: FastifyInstance,
  options: RostersRoutesOptions,
): Promise<void> {
  const zodServer = server.withTypeProvider<ZodTypeProvider>();
  const requireAdmin = createRequireAdmin(options.jwtService);
  const registerTeamToSeason = new RegisterTeamToSeason(
    options.repository,
    options.teamRepository,
    options.seasonRepository,
  );
  const addPlayerToRoster = new AddPlayerToRoster(options.repository);
  const removePlayerFromRoster = new RemovePlayerFromRoster(options.repository);

  zodServer.post(
    '/rosters/register',
    {
      preHandler: [requireAdmin],
      schema: { body: registerTeamToSeasonBodySchema },
    },
    async (request, reply) => {
      try {
        const body = request.body as RegisterTeamToSeasonBody;
        const result = await registerTeamToSeason.execute({
          teamId: TeamId.fromString(body.teamId),
          seasonId: SeasonId.fromString(body.seasonId),
        });
        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          return reply.code(statusCode).send({ message });
        }
        return reply.code(201).send({
          teamSeasonId: result.value.teamSeasonId.value,
          teamId: result.value.teamId.value,
          seasonId: result.value.seasonId.value,
          membersCount: result.value.members.length,
        });
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        return reply.code(statusCode).send({ message });
      }
    },
  );

  zodServer.post(
    '/rosters/:teamSeasonId/players',
    {
      preHandler: [requireAdmin],
      schema: { params: getRosterParamsSchema, body: addPlayerToRosterBodySchema },
    },
    async (request, reply) => {
      try {
        const { teamSeasonId: rawId } = request.params as { teamSeasonId: string };
        const body = request.body as AddPlayerToRosterBody;
        const result = await addPlayerToRoster.execute({
          teamSeasonId: TeamSeasonId.fromString(rawId),
          playerId: PlayerId.fromString(body.playerId),
          position: parsePosition(body.position),
        });
        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          return reply.code(statusCode).send({ message });
        }
        return reply.code(200).send({ membersCount: result.value.members.length });
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        return reply.code(statusCode).send({ message });
      }
    },
  );

  zodServer.delete(
    '/rosters/:teamSeasonId/players/:playerId',
    {
      preHandler: [requireAdmin],
      schema: { params: removePlayerFromRosterParamsSchema },
    },
    async (request, reply) => {
      try {
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
          return reply.code(statusCode).send({ message });
        }
        return reply.code(200).send({ membersCount: result.value.members.length });
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        return reply.code(statusCode).send({ message });
      }
    },
  );
}
