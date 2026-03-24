import { Player } from '@/domain/players/Player.entity';
import { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';
import type { IPlayerRepository } from '@/application/ports/players/Player.repository';
import { PlayerRole } from '@/domain/players/PlayerRole';
import { NotFoundError, ForbiddenError } from '@/domain/shared/errors';
import { Result } from '@/shared/result';

export interface GetPlayerByIdActor {
  id: PlayerId;
  role: PlayerRole;
}

/**
 * Obtiene un Player por su identificador.
 * Solo el propio Player o un ADMIN pueden ver cualquier jugador.
 * Si no existe, devuelve Result.fail(NotFoundError) (HTTP → 404).
 * Si el actor no tiene permiso, Result.fail(ForbiddenError) (HTTP → 403).
 */
export class GetPlayerById {
  constructor(private readonly repository: IPlayerRepository) {}

  async execute(
    id: PlayerId,
    actor: GetPlayerByIdActor,
  ): Promise<Result<Player, NotFoundError | ForbiddenError>> {
    const player = await this.repository.findById(id);
    if (player === null) {
      return Result.fail(new NotFoundError('Player', id.value));
    }
    const isSelf = actor.id.equals(id);
    const isAdmin = actor.role === PlayerRole.ADMIN;
    if (!isSelf && !isAdmin) {
      return Result.fail(new ForbiddenError());
    }
    return Result.ok(player);
  }
}

