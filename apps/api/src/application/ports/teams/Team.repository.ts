import type { Team } from '@/domain/teams/Team.entity';
import type { TeamId } from '@/domain/teams/TeamId.value-object';

export interface ITeamRepository {
  findById(id: TeamId): Promise<Team | null>;
  findByName(name: string): Promise<Team | null>;
  findAll(): Promise<Team[]>;
  save(team: Team): Promise<void>;
  delete(id: TeamId): Promise<void>;
}
