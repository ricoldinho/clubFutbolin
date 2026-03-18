import type { TeamRoster } from '@/domain/rosters/TeamRoster.entity';
import type { TeamSeasonId } from '@/domain/rosters/TeamSeasonId.value-object';
import type { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';
import type { Position } from '@/domain/rosters/Position';
import type { IRosterRepository } from '@/application/ports/rosters/Roster.repository';
import { NotFoundError, DomainValidationError } from '@/domain/shared/errors';
import { Result } from '@/shared/result';
import { parsePosition } from '@/domain/rosters/Position';

export type AddPlayerToRosterInput = {
  teamSeasonId: TeamSeasonId;
  playerId: PlayerId;
  position: Position;
};

type AddPlayerToRosterError = NotFoundError | DomainValidationError;

/**
 * Añade un jugador a la plantilla. Valida max 4 y sin duplicados.
 */
export class AddPlayerToRoster {
  constructor(private readonly rosterRepository: IRosterRepository) {}

  async execute(
    input: AddPlayerToRosterInput,
  ): Promise<Result<TeamRoster, AddPlayerToRosterError>> {
    const roster = await this.rosterRepository.findById(input.teamSeasonId);
    if (roster === null) {
      return Result.fail(new NotFoundError('TeamSeason', input.teamSeasonId.value));
    }
    try {
      const updated = roster.addPlayer(input.playerId, parsePosition(input.position));
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
