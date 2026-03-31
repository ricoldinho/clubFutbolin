import type { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import type { TeamSeasonId } from '@/domain/rosters/TeamSeasonId.value-object';
import { MatchId } from './MatchId.value-object';
import { MatchScore } from './MatchScore.value-object';
import { MatchStatus } from './MatchStatus';
import {
  MatchScoreUpdateNotAllowedError,
  MatchTeamsMustBeDifferentError,
} from './errors';
import { DomainValidationError } from '@/domain/shared/errors';

export interface MatchProps {
  seasonId: SeasonId;
  homeTeamSeasonId: TeamSeasonId;
  awayTeamSeasonId: TeamSeasonId;
  score?: MatchScore;
  date: Date;
  round: number;
  status?: MatchStatus;
}

export interface MatchWithIdProps extends MatchProps {
  id: MatchId;
}

/**
 * Aggregate Root del partido.
 * Invariantes:
 * - local y visitante deben ser distintos.
 * - no se puede actualizar el marcador si el partido está cancelado.
 * - al actualizar marcador válido el estado pasa a FINISHED.
 */
export class Match {
  readonly id?: MatchId;
  readonly seasonId: SeasonId;
  readonly homeTeamSeasonId: TeamSeasonId;
  readonly awayTeamSeasonId: TeamSeasonId;
  readonly score: MatchScore;
  readonly date: Date;
  readonly round: number;
  readonly status: MatchStatus;

  private constructor(props: MatchProps | MatchWithIdProps) {
    const withId = props as MatchWithIdProps;
    if (withId.id !== undefined) {
      this.id = withId.id;
    }

    if (props.homeTeamSeasonId.equals(props.awayTeamSeasonId)) {
      throw new MatchTeamsMustBeDifferentError();
    }
    if (!Number.isInteger(props.round) || props.round <= 0) {
      throw new DomainValidationError('La jornada debe ser un entero mayor que 0');
    }

    this.seasonId = props.seasonId;
    this.homeTeamSeasonId = props.homeTeamSeasonId;
    this.awayTeamSeasonId = props.awayTeamSeasonId;
    this.score = props.score ?? MatchScore.pending();
    this.date = new Date(props.date);
    this.round = props.round;
    this.status = props.status ?? MatchStatus.SCHEDULED;
  }

  static create(props: MatchProps | MatchWithIdProps): Match {
    return new Match(props);
  }

  updateScore(home: number, away: number): Match {
    if (this.status === MatchStatus.CANCELLED) {
      throw new MatchScoreUpdateNotAllowedError();
    }

    return Match.create({
      ...(this.id && { id: this.id }),
      seasonId: this.seasonId,
      homeTeamSeasonId: this.homeTeamSeasonId,
      awayTeamSeasonId: this.awayTeamSeasonId,
      date: this.date,
      round: this.round,
      score: MatchScore.fromResult(home, away),
      status: MatchStatus.FINISHED,
    });
  }

  updateStatus(status: MatchStatus): Match {
    return Match.create({
      ...(this.id && { id: this.id }),
      seasonId: this.seasonId,
      homeTeamSeasonId: this.homeTeamSeasonId,
      awayTeamSeasonId: this.awayTeamSeasonId,
      date: this.date,
      round: this.round,
      score: this.score,
      status,
    });
  }
}
