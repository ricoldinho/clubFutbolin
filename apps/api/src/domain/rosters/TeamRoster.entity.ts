import { TeamSeasonId } from './TeamSeasonId.value-object';
import type { TeamId } from '@/domain/teams/TeamId.value-object';
import type { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import { RosterMember } from './RosterMember';
import type { Position } from './Position';
import { DomainValidationError } from '@/domain/shared/errors';
import type { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';

export interface TeamRosterProps {
  teamSeasonId: TeamSeasonId;
  teamId: TeamId;
  seasonId: SeasonId;
  members?: readonly RosterMember[];
}

const MAX_ROSTER_SIZE = 4;

/**
 * Aggregate Root que maneja la plantilla de un equipo en una temporada.
 * Reglas: máximo 4 jugadores, sin duplicados.
 */
export class TeamRoster {
  readonly teamSeasonId: TeamSeasonId;
  readonly teamId: TeamId;
  readonly seasonId: SeasonId;
  private readonly _members: RosterMember[];

  private constructor(props: TeamRosterProps) {
    this.teamSeasonId = props.teamSeasonId;
    this.teamId = props.teamId;
    this.seasonId = props.seasonId;
    this._members = props.members ? [...props.members] : [];
  }

  static create(props: TeamRosterProps): TeamRoster {
    return new TeamRoster(props);
  }

  get members(): readonly RosterMember[] {
    return [...this._members];
  }

  addPlayer(playerId: PlayerId, position: Position): TeamRoster {
    if (this._members.length >= MAX_ROSTER_SIZE) {
      throw new DomainValidationError(
        `La plantilla no puede tener más de ${MAX_ROSTER_SIZE} jugadores`,
      );
    }
    const newMember = RosterMember.create({ playerId, position });
    const isDuplicate = this._members.some((m) => m.hasSamePlayerAs(newMember));
    if (isDuplicate) {
      throw new DomainValidationError('El jugador ya está en la plantilla');
    }
    return TeamRoster.create({
      teamSeasonId: this.teamSeasonId,
      teamId: this.teamId,
      seasonId: this.seasonId,
      members: [...this._members, newMember],
    });
  }

  removePlayer(playerId: PlayerId): TeamRoster {
    const filtered = this._members.filter((m) => !m.playerId.equals(playerId));
    if (filtered.length === this._members.length) {
      throw new DomainValidationError('El jugador no está en la plantilla');
    }
    return TeamRoster.create({
      teamSeasonId: this.teamSeasonId,
      teamId: this.teamId,
      seasonId: this.seasonId,
      members: filtered,
    });
  }
}
