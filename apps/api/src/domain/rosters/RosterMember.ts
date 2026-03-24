import type { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';
import type { Position } from './Position';

export interface RosterMemberProps {
  playerId: PlayerId;
  position: Position;
}

export class RosterMember {
  readonly playerId: PlayerId;
  readonly position: Position;

  private constructor(props: RosterMemberProps) {
    this.playerId = props.playerId;
    this.position = props.position;
  }

  static create(props: RosterMemberProps): RosterMember {
    return new RosterMember(props);
  }

  hasSamePlayerAs(other: RosterMember): boolean {
    return this.playerId.equals(other.playerId);
  }
}
