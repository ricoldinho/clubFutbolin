import { Team } from '@/domain/teams/Team.entity';
import { TeamId } from '@/domain/teams/TeamId.value-object';
import type { ITeamRepository } from '@/application/ports/teams/Team.repository';
import { NotFoundError, AlreadyExistsError } from '@/domain/shared/errors';
import { Result } from '@/shared/result';

export type UpdateTeamInput = {
  id: TeamId;
  name?: string;
};

type UpdateTeamError = NotFoundError | AlreadyExistsError;

/**
 * Actualiza un Team existente. Solo ADMIN.
 */
export class UpdateTeam {
  constructor(private readonly teamRepository: ITeamRepository) {}

  async execute(input: UpdateTeamInput): Promise<Result<Team, UpdateTeamError>> {
    const existing = await this.teamRepository.findById(input.id);
    if (existing === null) {
      return Result.fail(new NotFoundError('Team', input.id.value));
    }
    if (input.name !== undefined) {
      const byName = await this.teamRepository.findByName(input.name.trim());
      if (byName !== null && !byName.id?.equals(input.id)) {
        return Result.fail(new AlreadyExistsError('Team', `nombre "${input.name}"`));
      }
    }
    const updated = Team.create({
      id: input.id,
      name: input.name?.trim() ?? existing.name,
      createdAt: existing.createdAt,
    });
    await this.teamRepository.save(updated);
    return Result.ok(updated);
  }
}
