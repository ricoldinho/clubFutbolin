import type { IMatchRepository } from '@/application/ports/matches/Match.repository';
import type { Match } from '@/domain/matches/Match.entity';
import type { MatchId } from '@/domain/matches/MatchId.value-object';
import { NotFoundError } from '@/domain/shared/errors';
import { Result } from '@/shared/result';

/**
 * Obtiene un Match por id. Público.
 */
export class GetMatchById {
  constructor(private readonly matchRepository: IMatchRepository) {}

  async execute(matchId: MatchId): Promise<Result<Match, NotFoundError>> {
    const match = await this.matchRepository.findById(matchId);
    if (match === null) {
      return Result.fail(new NotFoundError('Match', matchId.value));
    }
    return Result.ok(match);
  }
}
