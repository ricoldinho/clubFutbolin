import type { League } from '@/domain/leagues/League.entity';
import type { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import type { ILeagueRepository } from '@/application/ports/leagues/League.repository';
import { NotFoundError } from '@/domain/shared/errors';
import { Result } from '@/shared/result';

/**
 * Obtiene una League por id. Público.
 */
export class GetLeagueById {
  constructor(private readonly repository: ILeagueRepository) {}

  async execute(id: LeagueId): Promise<Result<League, NotFoundError>> {
    const league = await this.repository.findById(id);
    if (league === null) {
      return Result.fail(new NotFoundError('League', id.value));
    }
    return Result.ok(league);
  }
}
