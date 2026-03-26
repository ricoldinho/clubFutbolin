import type { League } from '@/domain/leagues/League.entity';
import type { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import type { PaginationParams } from '@/shared/pagination';

export interface LeagueListResult {
  readonly data: League[];
  readonly total: number;
}

export interface ILeagueRepository {
  findById(id: LeagueId): Promise<League | null>;
  findAll(): Promise<League[]>;
  findAll(pagination: PaginationParams): Promise<LeagueListResult>;
  save(league: League): Promise<void>;
  delete(id: LeagueId): Promise<void>;
  countSeasonsByLeagueId(id: LeagueId): Promise<number>;
}
