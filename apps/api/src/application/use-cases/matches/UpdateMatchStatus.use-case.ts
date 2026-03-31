import type { IMatchRepository } from '@/application/ports/matches/Match.repository';
import type { MatchId } from '@/domain/matches/MatchId.value-object';
import { MatchStatus } from '@/domain/matches/MatchStatus';
import { NotFoundError } from '@/domain/shared/errors';
import { Result, type Result as ResultType } from '@/shared/result';

export interface UpdateMatchStatusInput {
  readonly matchId: MatchId;
  readonly status: MatchStatus.POSTPONED | MatchStatus.CANCELLED;
}

/**
 * Actualiza el estado de un partido existente.
 * Solo permite transiciones operativas manuales: POSTPONED y CANCELLED.
 */
export class UpdateMatchStatus {
  constructor(private readonly matchRepository: IMatchRepository) {}

  async execute(
    input: UpdateMatchStatusInput,
  ): Promise<ResultType<{ readonly matchId: string }, NotFoundError>> {
    const match = await this.matchRepository.findById(input.matchId);
    if (match === null) {
      return Result.fail(new NotFoundError('Match', input.matchId.value));
    }

    const updated = match.updateStatus(input.status);
    await this.matchRepository.save(updated);
    return Result.ok({ matchId: input.matchId.value });
  }
}
