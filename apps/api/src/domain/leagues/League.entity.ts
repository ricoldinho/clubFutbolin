import { LeagueId } from './LeagueId.value-object';
import type { LeagueCategory } from './LeagueCategory';

export interface LeagueProps {
  name: string;
  leagueCategory: LeagueCategory;
}

export interface LeagueIdProps extends LeagueProps {
  id: LeagueId;
}

export class League {
  readonly id?: LeagueId;
  readonly name: string;
  readonly leagueCategory: LeagueCategory;

  private constructor(props: LeagueProps | LeagueIdProps) {
    const withId = props as LeagueIdProps;
    if (withId.id !== undefined) {
      this.id = withId.id;
    }
    this.name = props.name;
    this.leagueCategory = props.leagueCategory;
  }

  static create(props: LeagueProps | LeagueIdProps): League {
    return new League(props);
  }
}
