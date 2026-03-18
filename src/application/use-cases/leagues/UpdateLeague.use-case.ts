import { League } from '@/domain/leagues/League.entity';
import type { LeagueCategory } from '@/domain/leagues/LeagueCategory';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import type { ILeagueRepository } from '@/application/ports/leagues/League.repository';
import { NotFoundError, AlreadyExistsError } from '@/domain/shared/errors';
import { Result } from '@/shared/result';

export type UpdateLeagueInput = {
  id: LeagueId;
  name?: string;
  leagueCategory?: LeagueCategory;
};

type UpdateLeagueError = NotFoundError | AlreadyExistsError;

/**
 * Actualiza una League existente. Solo ADMIN.
 */
export class UpdateLeague {
  constructor(private readonly repository: ILeagueRepository) {}

  async execute(input: UpdateLeagueInput): Promise<Result<League, UpdateLeagueError>> {
    const existing = await this.repository.findById(input.id);
    if (existing === null) {
      return Result.fail(new NotFoundError('League', input.id.value));
    }
    if (input.name !== undefined) {
      const all = await this.repository.findAll();
      const nameExists = all.some(
        (l) =>
          l.name.toLowerCase() === input.name!.trim().toLowerCase() &&
          !l.id?.equals(input.id),
      );
      if (nameExists) {
        return Result.fail(new AlreadyExistsError('League', `nombre "${input.name}"`));
      }
    }
    const updated = League.create({
      id: input.id,
      name: input.name?.trim() ?? existing.name,
      leagueCategory: input.leagueCategory ?? existing.leagueCategory,
    });
    await this.repository.save(updated);
    return Result.ok(updated);
  }
}
