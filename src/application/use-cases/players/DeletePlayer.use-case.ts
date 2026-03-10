import type { IPlayerRepository } from '@/application/ports/players/Player.repository';
import { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';
import { NotFoundError } from '@/domain/shared/errors';
import { Result } from '@/shared/result';

/**
 * Elimina un Player por su identificador.
 * Si no existe, devuelve Result.fail(NotFoundError) (en HTTP → 404).
 */
export class DeletePlayer {
  constructor(private readonly repository: IPlayerRepository) {}

  async execute(id: PlayerId): Promise<Result<void, NotFoundError>> {
    const existing = await this.repository.findById(id);
    if (existing === null) {
      return Result.fail(new NotFoundError('Player', id.value));
    }

    await this.repository.delete(id);
    return Result.ok<void>(undefined);
  }
}

