import type { ISeasonRepository, SeasonListResult } from '@/application/ports/seasons/Season.repository';
import { Result } from '@/shared/result';
import type { PaginationParams } from '@/shared/pagination';

export interface ListSeasonsInput {
  readonly pagination: PaginationParams;
}

/**
 * Lista todas las Seasons. Público.
 */
export class ListSeasons {
  constructor(private readonly repository: ISeasonRepository) {}

  async execute(input: ListSeasonsInput): Promise<Result<SeasonListResult, never>> {
    const seasons = await this.repository.findAll(input.pagination);
    return Result.ok(seasons);
  }
}
