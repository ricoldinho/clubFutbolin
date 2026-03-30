import { TeamId } from '@/domain/teams/TeamId.value-object';
import type { ITeamRepository } from '@/application/ports/teams/Team.repository';
import { NotFoundError } from '@/domain/shared/errors';
import { Result } from '@/shared/result';

/**
 * Elimina un Team. Solo ADMIN.
 */
export class DeleteTeam {
  constructor(private readonly teamRepository: ITeamRepository) {}

  async execute(id: TeamId): Promise<Result<void, NotFoundError>> {
    const existing = await this.teamRepository.findById(id);
    if (existing === null) {
      return Result.fail(new NotFoundError('Team', id.value));
    }
    await this.teamRepository.delete(id);
    return Result.ok(undefined);
  }
}
