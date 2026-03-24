import type { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import type { ISeasonRepository } from '@/application/ports/seasons/Season.repository';
import { NotFoundError } from '@/domain/shared/errors';
import { Result } from '@/shared/result';

/**
 * Elimina una Season. Solo ADMIN.
 */
export class DeleteSeason {
  constructor(private readonly repository: ISeasonRepository) {}

  async execute(id: SeasonId): Promise<Result<void, NotFoundError>> {
    const existing = await this.repository.findById(id);
    if (existing === null) {
      return Result.fail(new NotFoundError('Season', id.value));
    }
    await this.repository.delete(id);
    return Result.ok(undefined);
  }
}
