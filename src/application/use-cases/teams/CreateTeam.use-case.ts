import { Team } from '@/domain/teams/Team.entity';
import { TeamId } from '@/domain/teams/TeamId.value-object';
import type { ITeamRepository } from '@/application/ports/teams/Team.repository';
import { AlreadyExistsError } from '@/domain/shared/errors';
import { Result } from '@/shared/result';

export type CreateTeamInput = {
  name: string;
};

/**
 * Crea un nuevo Team. Solo ADMIN.
 * Si ya existe un equipo con el mismo nombre, devuelve AlreadyExistsError (409).
 */
export class CreateTeam {
  constructor(private readonly repository: ITeamRepository) {}

  async execute(input: CreateTeamInput): Promise<Result<Team, AlreadyExistsError>> {
    const existing = await this.repository.findByName(input.name.trim());
    if (existing !== null) {
      return Result.fail(new AlreadyExistsError('Team', `nombre "${input.name}"`));
    }
    const team = Team.create({
      id: TeamId.generate(),
      name: input.name.trim(),
    });
    await this.repository.save(team);
    return Result.ok(team);
  }
}
