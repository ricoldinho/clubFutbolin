import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { IPlayerRepository } from '@/application/ports/players/Player.repository';
import type { IPasswordHasher } from '@/application/ports/auth/PasswordHasher.port';
import type { IJwtService } from '@/application/ports/auth/JwtService.port';
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
import {
  getPlayerByIdParamsSchema,
  listPlayersQuerySchema,
  registerPlayerBodySchema,
  resolveListPlayersPagination,
  updatePlayerBodySchema,
  type RegisterPlayerBody,
  type UpdatePlayerBody,
} from './schemas';

/**
 * Plugin HTTP para las rutas de Player.
 *
 * Convenciones:
 * - Prefijo de recurso: /players
 * - POST /players y POST /auth/login son públicos; el resto requieren JWT.
 */
interface PlayersRoutesOptions extends FastifyPluginOptions {
  repository: IPlayerRepository;
  passwordHasher: IPasswordHasher;
  jwtService: IJwtService;
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
  category: string;
  role: string;
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
 * - GET    /players             → Listar Players (query opcional: page, pageSize; sin ellos, lista completa)
 * - GET    /players/:playerId   → Obtener un Player por id
 * - POST   /players             → Registrar un nuevo Player
 * - PATCH  /players/:playerId   → Actualizar datos de un Player existente
 * - DELETE /players/:playerId   → Eliminar un Player
 */
export async function playersRoutes(
  server: FastifyInstance,
  options: PlayersRoutesOptions,
): Promise<void> {
  const zodServer = server.withTypeProvider<ZodTypeProvider>();
  const requireAuth = createRequireAuth(options.jwtService);
  const getPlayerById = new GetPlayerById(options.repository);
  const listPlayers = new ListPlayers(options.repository);
  const registerPlayer = new RegisterPlayer(
    options.repository,
    options.passwordHasher,
  );
  const deletePlayer = new DeletePlayer(options.repository);
  const updatePlayer = new UpdatePlayer(options.repository);

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
      },
    },
    async (request, reply) => {
      try {
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
          return reply.code(statusCode).send({ message });
        }

        return reply.code(201).send(toPlayerResponse(result.value));
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        if (statusCode >= 500) {
          request.log.error({ err: error }, 'Error inesperado registrando Player');
        } else {
          request.log.warn({ err: error }, 'Error de dominio al registrar Player');
        }
        return reply.code(statusCode).send({ message });
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
      },
    },
    async (request, reply) => {
      try {
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
          return reply.code(statusCode).send({ message });
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
        return reply.code(statusCode).send({ message });
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
      },
    },
    async (request, reply) => {
      try {
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
          return reply.code(statusCode).send({ message });
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
        return reply.code(statusCode).send({ message });
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
      },
    },
    async (request, reply) => {
      try {
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
          return reply.code(statusCode).send({ message });
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
        return reply.code(statusCode).send({ message });
      }
    },
  );

  /**
   * GET /players
   *
   * Lista Players. Requiere autenticación (cualquier role).
   * Query opcional: `page`, `pageSize` (máx. 100). Si se envía solo uno, el otro usa valor por defecto.
   * Sin query de paginación se devuelve el listado completo.
   * - 200: lista (posiblemente vacía)
   * - 400: query inválida (page/pageSize)
   * - 401: sin token o token inválido
   */
  zodServer.get(
    '/players',
    {
      preHandler: [requireAuth],
      schema: {
        querystring: listPlayersQuerySchema,
      },
    },
    async (request, reply) => {
      try {
        const pagination = resolveListPlayersPagination(request.query);
        const result = await listPlayers.execute(
          pagination === undefined ? undefined : { pagination },
        );
        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          return reply.code(statusCode).send({ message });
        }
        const response = result.value.map(toPlayerResponse);
        return reply.code(200).send(response);
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        if (statusCode >= 500) {
          request.log.error({ err: error }, 'Error inesperado listando Players');
        }
        return reply.code(statusCode).send({ message });
      }
    },
  );
}

