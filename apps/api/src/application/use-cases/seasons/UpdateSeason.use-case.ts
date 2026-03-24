import { Season } from '@/domain/seasons/Season.entity';
import type { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import type { ISeasonRepository } from '@/application/ports/seasons/Season.repository';
import { NotFoundError } from '@/domain/shared/errors';
import { Result } from '@/shared/result';

export type UpdateSeasonInput = {
  id: SeasonId;
  year?: number;
};

/**
 * Actualiza una Season. Solo ADMIN.
 */
export class UpdateSeason {
  constructor(private readonly repository: ISeasonRepository) {}

  async execute(input: UpdateSeasonInput): Promise<Result<Season, NotFoundError>> {
    const existing = await this.repository.findById(input.id);
    if (existing === null) {
      return Result.fail(new NotFoundError('Season', input.id.value));
    }
    const updated = Season.create({
      id: input.id,
      year: input.year ?? existing.year,
      leagueId: existing.leagueId,
      championId: existing.championId,
      secondId: existing.secondId,
    });
    await this.repository.save(updated);
    return Result.ok(updated);
  }
}
