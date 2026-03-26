import type { ILeagueRepository, LeagueListResult } from '@/application/ports/leagues/League.repository';
import { Result } from '@/shared/result';
import type { PaginationParams } from '@/shared/pagination';

export interface ListLeaguesInput {
  readonly pagination: PaginationParams;
}

/**
 * Lista todas las Leagues. Público.
 */
export class ListLeagues {
  constructor(private readonly repository: ILeagueRepository) {}

  async execute(input: ListLeaguesInput): Promise<Result<LeagueListResult, never>> {
    const leagues = await this.repository.findAll(input.pagination);
    return Result.ok(leagues);
  }
}
