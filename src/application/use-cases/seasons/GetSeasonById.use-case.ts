import type { Season } from '@/domain/seasons/Season.entity';
import type { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import type { ISeasonRepository } from '@/application/ports/seasons/Season.repository';
import { NotFoundError } from '@/domain/shared/errors';
import { Result } from '@/shared/result';

/**
 * Obtiene una Season por id. Público.
 */
export class GetSeasonById {
  constructor(private readonly repository: ISeasonRepository) {}

  async execute(id: SeasonId): Promise<Result<Season, NotFoundError>> {
    const season = await this.repository.findById(id);
    if (season === null) {
      return Result.fail(new NotFoundError('Season', id.value));
    }
    return Result.ok(season);
  }
}
