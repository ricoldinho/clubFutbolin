import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import type { IPlayerRepository } from '@/application/ports/players/Player.repository';
import { GetPlayerById } from '@/application/use-cases/players/GetPlayerById.use-case';
import { ListPlayers } from '@/application/use-cases/players/ListPlayers.use-case';
import { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';
import type { Player } from '@/domain/players/Player.entity';

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
  const getPlayerById = new GetPlayerById(options.repository);
  const listPlayers = new ListPlayers(options.repository);

  /**
   * GET /players/:playerId
   *
   * Obtiene un Player por identificador.
   * - 200: Player encontrado
   * - 404: Player no encontrado
   * - 400: playerId con formato inválido (no es UUID)
   */
  server.get<{
    Params: { playerId: string };
    Reply: PlayerResponse | { message: string };
  }>('/players/:playerId', async (request, reply) => {
    try {
      const playerId = PlayerId.fromString(request.params.playerId);
      const player = await getPlayerById.execute(playerId);

      if (player === null) {
        return reply.code(404).send({ message: 'Player no encontrado' });
      }

      return reply.code(200).send(toPlayerResponse(player));
    } catch (error) {
      request.log.error({ err: error }, 'Error obteniendo Player por id');
      return reply.code(400).send({ message: 'Parámetro playerId inválido' });
    }
  });

  /**
   * GET /players
   *
   * Lista todos los Players.
   * - 200: lista (posiblemente vacía)
   *
   * Más adelante se puede extender con paginación y filtros por querystring.
   */
  server.get<{
    Reply: PlayerResponse[];
  }>('/players', async (_request, reply) => {
    const players = await listPlayers.execute();
    const response = players.map(toPlayerResponse);
    return reply.code(200).send(response);
  });
}

