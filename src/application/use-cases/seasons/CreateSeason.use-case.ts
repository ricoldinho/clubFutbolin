import { Season } from '@/domain/seasons/Season.entity';
import { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import type { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import type { ISeasonRepository } from '@/application/ports/seasons/Season.repository';
import type { ILeagueRepository } from '@/application/ports/leagues/League.repository';
import { NotFoundError, AlreadyExistsError } from '@/domain/shared/errors';
import { Result } from '@/shared/result';

export type CreateSeasonInput = {
  year: number;
  leagueId: LeagueId;
};

type CreateSeasonError = NotFoundError | AlreadyExistsError;

/**
 * Crea una nueva Season. Solo ADMIN.
 */
export class CreateSeason {
  constructor(
    private readonly seasonRepository: ISeasonRepository,
    private readonly leagueRepository: ILeagueRepository,
  ) {}

  async execute(input: CreateSeasonInput): Promise<Result<Season, CreateSeasonError>> {
    const league = await this.leagueRepository.findById(input.leagueId);
    if (league === null) {
      return Result.fail(new NotFoundError('League', input.leagueId.value));
    }
    const existing = await this.seasonRepository.findByLeagueId(input.leagueId);
    const duplicateYear = existing.some((s) => s.year === input.year);
    if (duplicateYear) {
      return Result.fail(
        new AlreadyExistsError('Season', `año ${input.year} en esta liga`),
      );
    }
    const season = Season.create({
      id: SeasonId.generate(),
      year: input.year,
      leagueId: input.leagueId,
    });
    await this.seasonRepository.save(season);
    return Result.ok(season);
  }
}
