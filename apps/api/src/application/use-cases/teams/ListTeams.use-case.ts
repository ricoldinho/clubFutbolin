import type { ITeamRepository, TeamListResult } from '@/application/ports/teams/Team.repository';
import { Result } from '@/shared/result';
import type { PaginationParams } from '@/shared/pagination';

export interface ListTeamsInput {
  readonly pagination: PaginationParams;
  /** Búsqueda por nombre (coincidencia parcial, sin distinguir mayúsculas en BD). */
  readonly searchQuery?: string;
}

/**
 * Lista Teams paginados con total para metadata.
 * Opcionalmente filtra por texto en el nombre.
 */
export class ListTeams {
  constructor(private readonly teamRepository: ITeamRepository) {}

  async execute(input: ListTeamsInput): Promise<Result<TeamListResult, never>> {
    const filters =
      input.searchQuery !== undefined && input.searchQuery.length > 0
        ? { searchQuery: input.searchQuery }
        : undefined;
    const teams = await this.teamRepository.findAll(input.pagination, filters);
    return Result.ok(teams);
  }
}
