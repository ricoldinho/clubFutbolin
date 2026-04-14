import type { IMatchRepository } from '@/application/ports/matches/Match.repository';
import type { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import { NotFoundError } from '@/domain/shared/errors';
import { Result, type Result as ResultType } from '@/shared/result';

export interface UpdateSeasonRoundDateInput {
  readonly seasonId: SeasonId;
  readonly round: number;
  readonly date: Date;
}

/**
 * Actualiza la fecha de todos los partidos de una jornada concreta de una season.
 * Solo ADMIN desde capa HTTP.
 */
export class UpdateSeasonRoundDate {
  constructor(private readonly matchRepository: IMatchRepository) {}

  async execute(
    input: UpdateSeasonRoundDateInput,
  ): Promise<ResultType<{ readonly updatedMatches: number }, NotFoundError>> {
    const updatedMatches = await this.matchRepository.updateRoundDate(
      input.seasonId,
      input.round,
      input.date,
    );
    if (updatedMatches === 0) {
      return Result.fail(new NotFoundError('Season round', `${input.seasonId.value}#${input.round}`));
    }
    return Result.ok({ updatedMatches });
  }
}
