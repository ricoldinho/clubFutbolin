import type { Team } from '@/domain/teams/Team.entity';
import type { ITeamRepository } from '@/application/ports/teams/Team.repository';
import { Result } from '@/shared/result';

/**
 * Lista todos los Teams. Público.
 */
export class ListTeams {
  constructor(private readonly repository: ITeamRepository) {}

  async execute(): Promise<Result<Team[], never>> {
    const teams = await this.repository.findAll();
    return Result.ok(teams);
  }
}
