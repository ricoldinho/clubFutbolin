import type { Team } from '@/domain/teams/Team.entity';
import type { ITeamRepository } from '@/application/ports/teams/Team.repository';
import { NotFoundError } from '@/domain/shared/errors';
import { Result } from '@/shared/result';

/**
 * Obtiene un Team por nombre. Público.
 */
export class GetTeamByName {
  constructor(private readonly repository: ITeamRepository) {}

  async execute(name: string): Promise<Result<Team, NotFoundError>> {
    const team = await this.repository.findByName(name.trim());
    if (team === null) {
      return Result.fail(new NotFoundError('Team', `nombre "${name}"`));
    }
    return Result.ok(team);
  }
}
