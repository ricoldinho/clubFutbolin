import type { Season } from '@/domain/seasons/Season.entity';
import type { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import type { TeamId } from '@/domain/teams/TeamId.value-object';
import type { ISeasonRepository } from '@/application/ports/seasons/Season.repository';
import type { ITeamRepository } from '@/application/ports/teams/Team.repository';
import { NotFoundError, DomainValidationError } from '@/domain/shared/errors';
import { Result } from '@/shared/result';

export type SetSeasonWinnersInput = {
  seasonId: SeasonId;
  championId: TeamId;
  secondId: TeamId;
};

type SetSeasonWinnersError = NotFoundError | DomainValidationError;

/**
 * Asigna campeón y subcampeón a una Season. Solo ADMIN.
 */
export class SetSeasonWinners {
  constructor(
    private readonly seasonRepository: ISeasonRepository,
    private readonly teamRepository: ITeamRepository,
  ) {}

  async execute(input: SetSeasonWinnersInput): Promise<Result<Season, SetSeasonWinnersError>> {
    const season = await this.seasonRepository.findById(input.seasonId);
    if (season === null) {
      return Result.fail(new NotFoundError('Season', input.seasonId.value));
    }
    const champion = await this.teamRepository.findById(input.championId);
    const second = await this.teamRepository.findById(input.secondId);
    if (champion === null) {
      return Result.fail(new NotFoundError('Team', input.championId.value));
    }
    if (second === null) {
      return Result.fail(new NotFoundError('Team', input.secondId.value));
    }
    try {
      const updated = season.setWinners(input.championId, input.secondId);
      await this.seasonRepository.save(updated);
      return Result.ok(updated);
    } catch (err) {
      if (err instanceof DomainValidationError) {
        return Result.fail(err);
      }
      throw err;
    }
  }
}
