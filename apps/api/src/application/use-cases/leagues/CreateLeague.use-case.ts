import { League } from '@/domain/leagues/League.entity';
import type { LeagueCategory } from '@/domain/leagues/LeagueCategory';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import type { ILeagueRepository } from '@/application/ports/leagues/League.repository';
import { AlreadyExistsError } from '@/domain/shared/errors';
import { Result } from '@/shared/result';

export type CreateLeagueInput = {
  name: string;
  leagueCategory: LeagueCategory;
};

/**
 * Crea una nueva League. Solo ADMIN.
 * Si ya existe una liga con el mismo nombre, devuelve AlreadyExistsError (409).
 */
export class CreateLeague {
  constructor(private readonly leagueRepository: ILeagueRepository) {}

  async execute(
    input: CreateLeagueInput,
  ): Promise<Result<League, AlreadyExistsError>> {
    const existing = await this.leagueRepository.findAll();
    const nameExists = existing.some(
      (l) => l.name.toLowerCase() === input.name.trim().toLowerCase(),
    );
    if (nameExists) {
      return Result.fail(new AlreadyExistsError('League', `nombre "${input.name}"`));
    }
    const league = League.create({
      id: LeagueId.generate(),
      name: input.name.trim(),
      leagueCategory: input.leagueCategory,
    });
    await this.leagueRepository.save(league);
    return Result.ok(league);
  }
}
