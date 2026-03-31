import type { IMatchRepository } from '@/application/ports/matches/Match.repository';
import {
  InvalidMatchScoreError,
  MatchScoreUpdateNotAllowedError,
} from '@/domain/matches/errors';
import { NotFoundError } from '@/domain/shared/errors';
import type { MatchId } from '@/domain/matches/MatchId.value-object';
import { Result, type Result as ResultType } from '@/shared/result';

export interface UpdateMatchScoreInput {
  readonly matchId: MatchId;
  readonly homeScore: number;
  readonly awayScore: number;
}

type UpdateMatchScoreError =
  | NotFoundError
  | MatchScoreUpdateNotAllowedError
  | InvalidMatchScoreError;

/**
 * Actualiza el marcador de un partido existente.
 * Delega invariantes de negocio al agregado Match.
 * Devuelve Result.fail en:
 * - NotFoundError: partido no encontrado
 * - MatchScoreUpdateNotAllowedError: partido cancelado
 * - InvalidMatchScoreError: score inválido (negativo/no entero)
 */
export class UpdateMatchScore {
  constructor(private readonly matchRepository: IMatchRepository) {}

  async execute(
    input: UpdateMatchScoreInput,
  ): Promise<ResultType<{ readonly matchId: string }, UpdateMatchScoreError>> {
    const match = await this.matchRepository.findById(input.matchId);
    if (match === null) {
      return Result.fail(new NotFoundError('Match', input.matchId.value));
    }

    try {
      const updated = match.updateScore(input.homeScore, input.awayScore);
      await this.matchRepository.save(updated);
      return Result.ok({ matchId: input.matchId.value });
    } catch (error) {
      if (
        error instanceof MatchScoreUpdateNotAllowedError ||
        error instanceof InvalidMatchScoreError
      ) {
        return Result.fail(error);
      }
      throw error;
    }
  }
}
