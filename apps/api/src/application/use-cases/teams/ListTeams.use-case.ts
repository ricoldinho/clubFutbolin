import type { ITeamRepository, TeamListResult } from '@/application/ports/teams/Team.repository';
import { Result } from '@/shared/result';
import type { PaginationParams } from '@/shared/pagination';

export interface ListTeamsInput {
  readonly pagination: PaginationParams;
}

/**
 * Lista todos los Teams. Público.
 */
export class ListTeams {
  constructor(private readonly teamRepository: ITeamRepository) {}

  async execute(input: ListTeamsInput): Promise<Result<TeamListResult, never>> {
    const teams = await this.teamRepository.findAll(input.pagination);
    return Result.ok(teams);
  }
}
