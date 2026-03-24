import type { League } from '@/domain/leagues/League.entity';
import type { LeagueId } from '@/domain/leagues/LeagueId.value-object';

export interface ILeagueRepository {
  findById(id: LeagueId): Promise<League | null>;
  findAll(): Promise<League[]>;
  save(league: League): Promise<void>;
  delete(id: LeagueId): Promise<void>;
  countSeasonsByLeagueId(id: LeagueId): Promise<number>;
}
