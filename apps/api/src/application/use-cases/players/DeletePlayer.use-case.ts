import type { IPlayerRepository } from '@/application/ports/players/Player.repository';
import { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';
import { PlayerRole } from '@/domain/players/PlayerRole';
import { NotFoundError, ForbiddenError } from '@/domain/shared/errors';
import { Result } from '@/shared/result';

export interface DeletePlayerActor {
  id: PlayerId;
  role: PlayerRole;
}

/**
 * Elimina un Player por su identificador.
 * Solo el propio Player o un ADMIN pueden eliminar.
 * Si no existe, devuelve Result.fail(NotFoundError) (HTTP → 404).
 * Si el actor no tiene permiso, Result.fail(ForbiddenError) (HTTP → 403).
 */
export class DeletePlayer {
  constructor(private readonly playerRepository: IPlayerRepository) {}

  async execute(
    id: PlayerId,
    actor: DeletePlayerActor,
  ): Promise<Result<void, NotFoundError | ForbiddenError>> {
    const existing = await this.playerRepository.findById(id);
    if (existing === null) {
      return Result.fail(new NotFoundError('Player', id.value));
    }
    const isSelf = actor.id.equals(id);
    const isAdmin = actor.role === PlayerRole.ADMIN;
    if (!isSelf && !isAdmin) {
      return Result.fail(new ForbiddenError());
    }

    await this.playerRepository.delete(id);
    return Result.ok<void>(undefined);
  }
}

