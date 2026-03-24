import { TeamId } from './TeamId.value-object';

export interface TeamProps {
  name: string;
  createdAt?: Date;
}

export interface TeamIdProps extends TeamProps {
  id: TeamId;
}

export class Team {
  readonly id?: TeamId;
  readonly name: string;
  readonly createdAt: Date;

  private constructor(props: TeamProps | TeamIdProps) {
    const withId = props as TeamIdProps;
    if (withId.id !== undefined) {
      this.id = withId.id;
    }
    this.name = props.name;
    this.createdAt = props.createdAt ?? new Date();
  }

  static create(props: TeamProps | TeamIdProps): Team {
    return new Team(props);
  }
}
