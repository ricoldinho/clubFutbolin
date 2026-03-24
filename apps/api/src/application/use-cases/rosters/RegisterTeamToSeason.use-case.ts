import { TeamRoster } from '@/domain/rosters/TeamRoster.entity';
import { TeamSeasonId } from '@/domain/rosters/TeamSeasonId.value-object';
import type { TeamId } from '@/domain/teams/TeamId.value-object';
import type { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import type { IRosterRepository } from '@/application/ports/rosters/Roster.repository';
import type { ITeamRepository } from '@/application/ports/teams/Team.repository';
import type { ISeasonRepository } from '@/application/ports/seasons/Season.repository';
import { NotFoundError, AlreadyExistsError } from '@/domain/shared/errors';
import { Result } from '@/shared/result';

export type RegisterTeamToSeasonInput = {
  teamId: TeamId;
  seasonId: SeasonId;
};

type RegisterTeamToSeasonError = NotFoundError | AlreadyExistsError;

/**
 * Inscribe un equipo en una temporada. Solo ADMIN.
 */
export class RegisterTeamToSeason {
  constructor(
    private readonly rosterRepository: IRosterRepository,
    private readonly teamRepository: ITeamRepository,
    private readonly seasonRepository: ISeasonRepository,
  ) {}

  async execute(
    input: RegisterTeamToSeasonInput,
  ): Promise<Result<TeamRoster, RegisterTeamToSeasonError>> {
    const team = await this.teamRepository.findById(input.teamId);
    if (team === null) {
      return Result.fail(new NotFoundError('Team', input.teamId.value));
    }
    const season = await this.seasonRepository.findById(input.seasonId);
    if (season === null) {
      return Result.fail(new NotFoundError('Season', input.seasonId.value));
    }
    const existing = await this.rosterRepository.findTeamSeasonByTeamAndSeason(
      input.teamId,
      input.seasonId,
    );
    if (existing !== null) {
      return Result.fail(
        new AlreadyExistsError('TeamSeason', `equipo ya inscrito en esta temporada`),
      );
    }
    const roster = TeamRoster.create({
      teamSeasonId: TeamSeasonId.generate(),
      teamId: input.teamId,
      seasonId: input.seasonId,
    });
    await this.rosterRepository.saveTeamSeason(roster);
    return Result.ok(roster);
  }
}
