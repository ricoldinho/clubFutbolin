import { Player } from '@/domain/players/Player.entity';
import { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';
import type { IPlayerRepository } from '@/application/ports/players/Player.repository';
import { NotFoundError } from '@/domain/shared/errors';
import { Result } from '@/shared/result';

/**
 * Obtiene un Player por su identificador.
 * Si no existe, devuelve Result.fail(NotFoundError) (en HTTP → 404).
 */
export class GetPlayerById {
  constructor(private readonly repository: IPlayerRepository) {}

  async execute(id: PlayerId): Promise<Result<Player, NotFoundError>> {
    const player = await this.repository.findById(id);
    if (player === null) {
      return Result.fail(new NotFoundError('Player', id.value));
    }
    return Result.ok(player);
  }
}

