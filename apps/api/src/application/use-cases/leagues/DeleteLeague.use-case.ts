import { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import type { ILeagueRepository } from '@/application/ports/leagues/League.repository';
import { NotFoundError, DomainValidationError } from '@/domain/shared/errors';
import { Result } from '@/shared/result';

type DeleteLeagueError = NotFoundError | DomainValidationError;

/**
 * Elimina una League. Solo ADMIN.
 * Si la liga tiene Seasons asociadas, falla con DomainValidationError.
 */
export class DeleteLeague {
  constructor(private readonly repository: ILeagueRepository) {}

  async execute(id: LeagueId): Promise<Result<void, DeleteLeagueError>> {
    const existing = await this.repository.findById(id);
    if (existing === null) {
      return Result.fail(new NotFoundError('League', id.value));
    }
    const seasonCount = await this.repository.countSeasonsByLeagueId(id);
    if (seasonCount > 0) {
      return Result.fail(
        new DomainValidationError(
          `No se puede eliminar la liga: tiene ${seasonCount} temporada(s) asociada(s)`,
        ),
      );
    }
    await this.repository.delete(id);
    return Result.ok(undefined);
  }
}
