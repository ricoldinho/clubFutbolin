import { z } from 'zod';
import type { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { IJwtService } from '@/application/ports/auth/JwtService.port';
import type { IPlayerRepository } from '@/application/ports/players/Player.repository';
import type { IRosterRepository } from '@/application/ports/rosters/Roster.repository';
import type { IPasswordHasher } from '@/application/ports/auth/PasswordHasher.port';
import { GetPlayerById } from '@/application/use-cases/players/GetPlayerById.use-case';
import { ListPlayers } from '@/application/use-cases/players/ListPlayers.use-case';
import { RegisterPlayer } from '@/application/use-cases/players/RegisterPlayer.use-case';
import { DeletePlayer } from '@/application/use-cases/players/DeletePlayer.use-case';
import { UpdatePlayer } from '@/application/use-cases/players/UpdatePlayer.use-case';
import { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';
import { parsePlayerRole } from '@/domain/players/PlayerRole';
import type { Player } from '@/domain/players/Player.entity';
import { Email } from '@/domain/players/value-objects/Email.value-object';
import { PhoneNumber } from '@/domain/players/value-objects/PhoneNumber.value-object';
import { Birthdate } from '@/domain/players/value-objects/Birthdate.value-object';
import { parsePlayerCategory } from '@/domain/players/PlayerCategory';
import { mapDomainErrorToHttp } from '@/adapters/http/http-error-mapper';
import { createRequireAuth } from '@/adapters/http/auth/auth-plugin';
import type { PlayerCategory } from '@/domain/players/PlayerCategory';
import type { PlayerRole } from '@/domain/players/PlayerRole';
import {
  getPlayerByIdParamsSchema,
  listPlayersQuerySchema,
  type ListPlayersQuery,
  listPlayersResponseSchema,
  playerResponseSchema,
  playerMembershipsResponseSchema,
  registerPlayerBodySchema,
  updatePlayerBodySchema,
  type RegisterPlayerBody,
  type UpdatePlayerBody,
} from './schemas';
import { computeLastPage } from '@/shared/pagination';
import { httpErrorResponseSchema } from '@/adapters/http/http-response-schemas';

/**
 * Plugin HTTP para las rutas de Player.
 *
 * Convenciones:
 * - Prefijo de recurso: /players
 * - POST /players y POST /auth/login son públicos; el resto requieren JWT.
 */
interface PlayersRoutesOptions extends FastifyPluginOptions {
  repository?: IPlayerRepository;
  rosterRepository?: IRosterRepository;
  passwordHasher?: IPasswordHasher;
  jwtService?: IJwtService;
  getPlayerById?: GetPlayerById;
  listPlayers?: ListPlayers;
  registerPlayer?: RegisterPlayer;
  deletePlayer?: DeletePlayer;
  updatePlayer?: UpdatePlayer;
}

/**
 * DTO de salida para exponer un Player por HTTP.
 * La entidad de dominio nunca se expone directamente.
 */
interface PlayerResponse {
  id: string | null;
  name: string;
  lastname: string;
  nickname: string | null;
  email: string;
  phoneNumber: string;
  birthdate: string;
  category: PlayerCategory;
  role: PlayerRole;
}


function toPlayerResponse(player: Player): PlayerResponse {
  return {
    id: player.id?.value ?? null,
    name: player.name,
    lastname: player.lastname,
    nickname: player.nickname,
    email: player.email.value,
    phoneNumber: player.phoneNumber.value,
    birthdate: player.birthdate.value.toISOString().slice(0, 10),
    category: player.category,
    role: player.role,
  };
}

/**
 * Registra las rutas HTTP relacionadas con Player.
 *
 * Endpoints:
 * - GET    /players             → Listar Players paginados (query opcional: page, limit)
 * - GET    /players/:playerId   → Obtener un Player por id
 * - GET    /players/:playerId/memberships → Obtener ligas/equipos en los que participa un Player
 * - POST   /players             → Registrar un nuevo Player
 * - PATCH  /players/:playerId   → Actualizar datos de un Player existente
 * - DELETE /players/:playerId   → Eliminar un Player
 */
export async function playersRoutes(
  server: FastifyInstance,
  options: PlayersRoutesOptions = {},
): Promise<void> {
  const zodServer = server.withTypeProvider<ZodTypeProvider>();
  const requireAuth = createRequireAuth(options.jwtService ?? server.container.cradle.jwtService);
  const resolveGetPlayerById = (request: FastifyRequest): GetPlayerById =>
    options.getPlayerById ??
    (options.repository
      ? new GetPlayerById(options.repository)
      : request.container.cradle.getPlayerById);

  const resolveListPlayers = (request: FastifyRequest): ListPlayers =>
    options.listPlayers ??
    (options.repository
      ? new ListPlayers(options.repository)
      : request.container.cradle.listPlayers);

  const resolveRegisterPlayer = (request: FastifyRequest): RegisterPlayer =>
    options.registerPlayer ??
    (options.repository && options.passwordHasher
      ? new RegisterPlayer(options.repository, options.passwordHasher)
      : request.container.cradle.registerPlayer);

  const resolveDeletePlayer = (request: FastifyRequest): DeletePlayer =>
    options.deletePlayer ??
    (options.repository
      ? new DeletePlayer(options.repository)
      : request.container.cradle.deletePlayer);

  const resolveUpdatePlayer = (request: FastifyRequest): UpdatePlayer =>
    options.updatePlayer ??
    (options.repository
      ? new UpdatePlayer(options.repository)
      : request.container.cradle.updatePlayer);

  /**
   * POST /players
   *
   * Registra un nuevo Player.
   * - 201: Player creado
   * - 400: datos de entrada inválidos (Zod o Value Objects)
   * - 409: email ya en uso
   */
  zodServer.post(
    '/players',
    {
      schema: {
        body: registerPlayerBodySchema,
        response: {
          201: playerResponseSchema,
          400: httpErrorResponseSchema,
          409: httpErrorResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['players'],
        summary: 'Registrar player',
      },
    },
    async (request, reply) => {
      try {
        const registerPlayer = resolveRegisterPlayer(request);
        const body = request.body as RegisterPlayerBody;

        const result = await registerPlayer.execute({
          name: body.name,
          lastname: body.lastname,
          nickname: body.nickname ?? null,
          email: Email.create(body.email),
          phoneNumber: PhoneNumber.create(body.phoneNumber),
          birthdate: Birthdate.create(body.birthdate),
          category: parsePlayerCategory(body.category),
          password: body.password,
        });

        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          if (statusCode === 409) {
            request.log.info({ err: result.error }, 'Email ya en uso al registrar Player');
          } else {
            request.log.warn({ err: result.error }, 'Error de dominio al registrar Player');
          }
          return reply
            .code(statusCode as 400 | 409 | 500)
            .send({ message });
        }

        return reply.code(201).send(toPlayerResponse(result.value));
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        if (statusCode >= 500) {
          request.log.error({ err: error }, 'Error inesperado registrando Player');
        } else {
          request.log.warn({ err: error }, 'Error de dominio al registrar Player');
        }
        return reply
          .code(statusCode as 400 | 409 | 500)
          .send({ message });
      }
    },
  );

  /**
   * GET /players/:playerId
   *
   * Obtiene un Player por identificador. Requiere autenticación; solo el propio Player o ADMIN.
   * - 200: Player encontrado
   * - 401: sin token o token inválido
   * - 403: sin permiso para ver este jugador
   * - 404: Player no encontrado
   */
  zodServer.get(
    '/players/:playerId',
    {
      preHandler: [requireAuth],
      schema: {
        params: getPlayerByIdParamsSchema,
        response: {
          200: playerResponseSchema,
          400: httpErrorResponseSchema,
          401: httpErrorResponseSchema,
          403: httpErrorResponseSchema,
          404: httpErrorResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['players'],
        summary: 'Obtener player por id',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const getPlayerById = resolveGetPlayerById(request);
        const { playerId: rawId } = request.params as { playerId: string };
        const playerId = PlayerId.fromString(rawId);
        const actor = {
          id: PlayerId.fromString(request.user!.playerId),
          role: parsePlayerRole(request.user!.role),
        };
        const result = await getPlayerById.execute(playerId, actor);

        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          request.log.warn({ err: result.error }, 'Player no encontrado o sin permiso');
          return reply
            .code(statusCode as 400 | 401 | 403 | 404 | 500)
            .send({ message });
        }

        return reply.code(200).send(toPlayerResponse(result.value));
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        if (statusCode >= 500) {
          request.log.error(
            { err: error },
            'Error inesperado obteniendo Player por id',
          );
        } else {
          request.log.warn({ err: error }, 'Error de dominio en GET /players/:playerId');
        }
        return reply
          .code(statusCode as 400 | 401 | 403 | 404 | 500)
          .send({ message });
      }
    },
  );

  /**
   * GET /players/:playerId/memberships
   *
   * Obtiene las membresías del jugador (equipos, temporadas y ligas).
   * Requiere autenticación; solo el propio Player o ADMIN.
   * - 200: listado (posiblemente vacío)
   * - 401: sin token o token inválido
   * - 403: sin permiso para ver este jugador
   * - 400: playerId inválido
   */
  zodServer.get(
    '/players/:playerId/memberships',
    {
      preHandler: [requireAuth],
      schema: {
        params: getPlayerByIdParamsSchema,
        response: {
          200: playerMembershipsResponseSchema,
          400: httpErrorResponseSchema,
          401: httpErrorResponseSchema,
          403: httpErrorResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['players'],
        summary: 'Obtener membresías de player',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const { playerId: rawId } = request.params as { playerId: string };
        const playerId = PlayerId.fromString(rawId);
        const actorId = PlayerId.fromString(request.user!.playerId);
        const actorRole = parsePlayerRole(request.user!.role);

        if (!actorId.equals(playerId) && actorRole !== 'ADMIN') {
          return reply.code(403).send({ message: 'No tienes permisos para este recurso' });
        }

        const rosterRepository =
          options.rosterRepository ?? request.container.cradle.rosterRepository;
        const memberships = await rosterRepository.findMembershipsByPlayerId(playerId);

        return reply.code(200).send({
          data: memberships.map((membership) => ({
            teamSeasonId: membership.teamSeasonId.value,
            team: {
              id: membership.teamId.value,
              name: membership.teamName,
            },
            season: {
              id: membership.seasonId.value,
              year: membership.seasonYear,
            },
            league: {
              id: membership.leagueId,
              name: membership.leagueName,
            },
          })),
        });
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        if (statusCode >= 500) {
          request.log.error(
            { err: error },
            'Error inesperado obteniendo membresías de Player',
          );
        } else {
          request.log.warn(
            { err: error },
            'Error de dominio en GET /players/:playerId/memberships',
          );
        }
        return reply
          .code(statusCode as 400 | 401 | 403 | 500)
          .send({ message });
      }
    },
  );

  /**
   * DELETE /players/:playerId
   *
   * Elimina un Player. Requiere autenticación; solo el propio Player o ADMIN.
   * - 204: Player eliminado
   * - 401: sin token o token inválido
   * - 403: sin permiso
   * - 404: Player no encontrado
   */
  zodServer.delete(
    '/players/:playerId',
    {
      preHandler: [requireAuth],
      schema: {
        params: getPlayerByIdParamsSchema,
        response: {
          204: z.any(),
          400: httpErrorResponseSchema,
          401: httpErrorResponseSchema,
          403: httpErrorResponseSchema,
          404: httpErrorResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['players'],
        summary: 'Eliminar player',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const deletePlayer = resolveDeletePlayer(request);
        const { playerId: rawId } = request.params as { playerId: string };
        const playerId = PlayerId.fromString(rawId);
        const actor = {
          id: PlayerId.fromString(request.user!.playerId),
          role: parsePlayerRole(request.user!.role),
        };
        const result = await deletePlayer.execute(playerId, actor);

        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          request.log.warn({ err: result.error }, 'Player no encontrado o sin permiso al eliminar');
          return reply
            .code(statusCode as 400 | 401 | 403 | 404 | 500)
            .send({ message });
        }

        return reply.code(204).send();
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        if (statusCode >= 500) {
          request.log.error(
            { err: error },
            'Error inesperado eliminando Player por id',
          );
        } else {
          request.log.warn({ err: error }, 'Error de dominio en DELETE /players/:playerId');
        }
        return reply
          .code(statusCode as 400 | 401 | 403 | 404 | 500)
          .send({ message });
      }
    },
  );

  /**
   * PATCH /players/:playerId
   *
   * Actualiza los datos de un Player. Requiere autenticación.
   * Solo un ADMIN puede asignar role ADMIN a otro.
   * - 200: Player actualizado
   * - 401: sin token o token inválido
   * - 403: sin permiso (ej. USER intentando asignar ADMIN)
   * - 404: Player no encontrado
   * - 409: email ya en uso
   */
  zodServer.patch(
    '/players/:playerId',
    {
      preHandler: [requireAuth],
      schema: {
        params: getPlayerByIdParamsSchema,
        body: updatePlayerBodySchema,
        response: {
          200: playerResponseSchema,
          400: httpErrorResponseSchema,
          401: httpErrorResponseSchema,
          403: httpErrorResponseSchema,
          404: httpErrorResponseSchema,
          409: httpErrorResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['players'],
        summary: 'Actualizar player',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const updatePlayer = resolveUpdatePlayer(request);
        const { playerId: rawId } = request.params as { playerId: string };
        const body = request.body as UpdatePlayerBody;
        const playerId = PlayerId.fromString(rawId);
        const actor = {
          id: PlayerId.fromString(request.user!.playerId),
          role: parsePlayerRole(request.user!.role),
        };

        const input = {
          id: playerId,
          actor,
          name: body.name,
          lastname: body.lastname,
          nickname: body.nickname,
          email: body.email ? Email.create(body.email) : undefined,
          phoneNumber: body.phoneNumber
            ? PhoneNumber.create(body.phoneNumber)
            : undefined,
          birthdate: body.birthdate
            ? Birthdate.create(body.birthdate)
            : undefined,
          category: body.category
            ? parsePlayerCategory(body.category)
            : undefined,
          role: body.role ? parsePlayerRole(body.role) : undefined,
        };

        const result = await updatePlayer.execute(input);

        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          if (statusCode === 409) {
            request.log.info(
              { err: result.error },
              'Email ya en uso al actualizar Player',
            );
          } else {
            request.log.warn(
              { err: result.error },
              'Error de dominio al actualizar Player',
            );
          }
          return reply
            .code(statusCode as 200 | 400 | 401 | 403 | 404 | 409 | 500)
            .send({ message });
        }

        return reply.code(200).send(toPlayerResponse(result.value));
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        if (statusCode >= 500) {
          request.log.error(
            { err: error },
            'Error inesperado actualizando Player',
          );
        } else {
          request.log.warn(
            { err: error },
            'Error de dominio en PATCH /players/:playerId',
          );
        }
        return reply
          .code(statusCode as 200 | 400 | 401 | 403 | 404 | 409 | 500)
          .send({ message });
      }
    },
  );

  /**
   * GET /players
   *
   * Lista Players. Requiere autenticación (cualquier role).
   * Query opcional: `page`, `limit` (máx. 100), `q` (búsqueda en nombre, apellidos o alias, máx. 100 caracteres).
   * Si no se envían page/limit, usa defaults page=1, limit=20.
   * - 200: objeto paginado con lista (posiblemente vacía)
   * - 400: query inválida (page/limit/q)
   * - 401: sin token o token inválido
   */
  zodServer.get(
    '/players',
    {
      preHandler: [requireAuth],
      schema: {
        querystring: listPlayersQuerySchema,
        response: {
          200: listPlayersResponseSchema,
          400: httpErrorResponseSchema,
          401: httpErrorResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['players'],
        summary: 'Listar players paginados',
        description:
          'Lista paginada. El parámetro opcional `q` filtra por coincidencia parcial en nombre, apellidos o alias (sin distinguir mayúsculas).',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const listPlayers = resolveListPlayers(request);
        const query = request.query as ListPlayersQuery;
        const result = await listPlayers.execute({
          pagination: { page: query.page, limit: query.limit },
          searchQuery: query.q,
        });
        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          return reply
            .code(statusCode as 400 | 401 | 500)
            .send({ message });
        }
        const response = {
          data: result.value.data.map(toPlayerResponse),
          meta: {
            total: result.value.total,
            page: query.page,
            lastPage: computeLastPage(result.value.total, query.limit),
          },
        };
        return reply.code(200).send(response);
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        if (statusCode >= 500) {
          request.log.error({ err: error }, 'Error inesperado listando Players');
        }
        return reply
          .code(statusCode as 400 | 401 | 500)
          .send({ message });
      }
    },
  );
}

