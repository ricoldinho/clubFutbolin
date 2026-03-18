import type { Season } from '@/domain/seasons/Season.entity';
import type { ISeasonRepository } from '@/application/ports/seasons/Season.repository';
import { Result } from '@/shared/result';

/**
 * Lista todas las Seasons. Público.
 */
export class ListSeasons {
  constructor(private readonly repository: ISeasonRepository) {}

  async execute(): Promise<Result<Season[], never>> {
    const seasons = await this.repository.findAll();
    return Result.ok(seasons);
  }
}
