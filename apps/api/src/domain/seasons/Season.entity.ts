import { SeasonId } from './SeasonId.value-object';
import type { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import type { TeamId } from '@/domain/teams/TeamId.value-object';
import { DomainValidationError } from '@/domain/shared/errors';

export interface SeasonProps {
  year: number;
  leagueId: LeagueId;
  championId?: TeamId | null;
  secondId?: TeamId | null;
}

export interface SeasonIdProps extends SeasonProps {
  id: SeasonId;
}

export class Season {
  readonly id?: SeasonId;
  readonly year: number;
  readonly leagueId: LeagueId;
  readonly championId: TeamId | null;
  readonly secondId: TeamId | null;

  private constructor(props: SeasonProps | SeasonIdProps) {
    const withId = props as SeasonIdProps;
    if (withId.id !== undefined) {
      this.id = withId.id;
    }
    this.year = props.year;
    this.leagueId = props.leagueId;
    this.championId = props.championId ?? null;
    this.secondId = props.secondId ?? null;
  }

  static create(props: SeasonProps | SeasonIdProps): Season {
    return new Season(props);
  }

  /**
   * Asigna campeón y subcampeón. Regla: ambos ids deben ser diferentes.
   */
  setWinners(championId: TeamId, secondId: TeamId): Season {
    if (championId.equals(secondId)) {
      throw new DomainValidationError('El campeón y subcampeón deben ser equipos diferentes');
    }
    return Season.create({
      ...(this.id && { id: this.id }),
      year: this.year,
      leagueId: this.leagueId,
      championId,
      secondId,
    });
  }
}
