import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { IPlayerRepository } from '@/application/ports/players/Player.repository';
import { GetPlayerById } from '@/application/use-cases/players/GetPlayerById.use-case';
import { ListPlayers } from '@/application/use-cases/players/ListPlayers.use-case';
import { RegisterPlayer } from '@/application/use-cases/players/RegisterPlayer.use-case';
import { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';
import type { Player } from '@/domain/players/Player.entity';
import { Email } from '@/domain/players/value-objects/Email.value-object';
import { PhoneNumber } from '@/domain/players/value-objects/PhoneNumber.value-object';
import { Birthdate } from '@/domain/players/value-objects/Birthdate.value-object';
import { parsePlayerCategory } from '@/domain/players/PlayerCategory';
import { EmailAlreadyInUseError } from '@/domain/players/errors';
import { DomainValidationError } from '@/domain/shared/errors';
import {
  getPlayerByIdParamsSchema,
  registerPlayerBodySchema,
  type RegisterPlayerBody,
} from './schemas';

/**
 * Plugin HTTP para las rutas de Player.
 *
 * Convenciones:
 * - Prefijo de recurso: /players
 * - Casos de uso de solo lectura: GetPlayerById, ListPlayers
 * - La capa HTTP traduce los errores a códigos de estado (400, 404, ...)
 */
interface PlayersRoutesOptions extends FastifyPluginOptions {
  repository: IPlayerRepository;
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
  league: string[];
  birthdate: string;
  category: string;
}

function toPlayerResponse(player: Player): PlayerResponse {
  return {
    id: player.id?.value ?? null,
    name: player.name,
    lastname: player.lastname,
    nickname: player.nickname,
    email: player.email.value,
    phoneNumber: player.phoneNumber.value,
    league: [...player.league],
    birthdate: player.birthdate.value.toISOString().slice(0, 10),
    category: player.category,
  };
}

/**
 * Registra las rutas HTTP relacionadas con Player.
 *
 * - GET /players           → Listar todos los players
 * - GET /players/:playerId → Obtener un player por id
 */
export async function playersRoutes(
  server: FastifyInstance,
  options: PlayersRoutesOptions,
): Promise<void> {
  const zodServer = server.withTypeProvider<ZodTypeProvider>();
  const getPlayerById = new GetPlayerById(options.repository);
  const listPlayers = new ListPlayers(options.repository);
  const registerPlayer = new RegisterPlayer(options.repository);

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

        const props = {
          name: body.name,
          lastname: body.lastname,
          nickname: body.nickname ?? null,
          email: Email.create(body.email),
          phoneNumber: PhoneNumber.create(body.phoneNumber),
          league: body.league,
          birthdate: Birthdate.create(body.birthdate),
          category: parsePlayerCategory(body.category),
        };

        const player = await registerPlayer.execute(props);

        return reply.code(201).send(toPlayerResponse(player));
      } catch (error) {
        if (error instanceof EmailAlreadyInUseError) {
          request.log.info(
            { err: error },
            'Email ya en uso al registrar Player',
          );
          return reply.code(409).send({ message: error.message });
        }

        if (error instanceof DomainValidationError) {
          request.log.warn(
            { err: error },
            'Error de validación de dominio al registrar Player',
          );
          return reply.code(400).send({ message: error.message });
        }

        request.log.error({ err: error }, 'Error inesperado registrando Player');
        return reply.code(500).send({ message: 'Error interno del servidor' });
      }
    },
  );

  /**
   * GET /players/:playerId
   *
   * Obtiene un Player por identificador.
   * - 200: Player encontrado
   * - 404: Player no encontrado
   * - 400: playerId con formato inválido (no es UUID)
   */
  zodServer.get(
    '/players/:playerId',
    {
      schema: {
        params: getPlayerByIdParamsSchema,
      },
    },
    async (request, reply) => {
      try {
        const { playerId: rawId } = request.params as { playerId: string };
        const playerId = PlayerId.fromString(rawId);
        const player = await getPlayerById.execute(playerId);

        if (player === null) {
          return reply.code(404).send({ message: 'Player no encontrado' });
        }

        return reply.code(200).send(toPlayerResponse(player));
      } catch (error) {
        if (error instanceof DomainValidationError) {
          request.log.warn({ err: error }, 'PlayerId inválido');
          return reply.code(400).send({ message: error.message });
        }

        request.log.error(
          { err: error },
          'Error inesperado obteniendo Player por id',
        );
        return reply.code(500).send({ message: 'Error interno del servidor' });
      }
    },
  );

  /**
   * GET /players
   *
   * Lista todos los Players.
   * - 200: lista (posiblemente vacía)
   *
   * Más adelante se puede extender con paginación y filtros por querystring.
   */
  zodServer.get(
    '/players',
    async (request, reply) => {
      try {
        const players = await listPlayers.execute();
        const response = players.map(toPlayerResponse);
        return reply.code(200).send(response);
      } catch (error) {
        request.log.error(
          { err: error },
          'Error inesperado listando Players',
        );
        return reply
          .code(500)
          .send({ message: 'Error interno del servidor' });
      }
    },
  );
}

