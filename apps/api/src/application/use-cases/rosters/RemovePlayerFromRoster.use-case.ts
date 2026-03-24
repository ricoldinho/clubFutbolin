import type { TeamRoster } from '@/domain/rosters/TeamRoster.entity';
import type { TeamSeasonId } from '@/domain/rosters/TeamSeasonId.value-object';
import type { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';
import type { IRosterRepository } from '@/application/ports/rosters/Roster.repository';
import { NotFoundError, DomainValidationError } from '@/domain/shared/errors';
import { Result } from '@/shared/result';

export type RemovePlayerFromRosterInput = {
  teamSeasonId: TeamSeasonId;
  playerId: PlayerId;
};

type RemovePlayerFromRosterError = NotFoundError | DomainValidationError;

/**
 * Elimina un jugador de la plantilla.
 */
export class RemovePlayerFromRoster {
  constructor(private readonly rosterRepository: IRosterRepository) {}

  async execute(
    input: RemovePlayerFromRosterInput,
  ): Promise<Result<TeamRoster, RemovePlayerFromRosterError>> {
    const roster = await this.rosterRepository.findById(input.teamSeasonId);
    if (roster === null) {
      return Result.fail(new NotFoundError('TeamSeason', input.teamSeasonId.value));
    }
    try {
      const updated = roster.removePlayer(input.playerId);
      await this.rosterRepository.saveRoster(updated);
      return Result.ok(updated);
    } catch (err) {
      if (err instanceof DomainValidationError) {
        return Result.fail(err);
      }
      throw err;
    }
  }
}
