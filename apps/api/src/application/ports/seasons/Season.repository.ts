import type { Season } from '@/domain/seasons/Season.entity';
import type { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import type { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import type { PaginationParams } from '@/shared/pagination';

export interface SeasonListResult {
  readonly data: Season[];
  readonly total: number;
}

export interface ISeasonRepository {
  findById(id: SeasonId): Promise<Season | null>;
  findAll(): Promise<Season[]>;
  findAll(pagination: PaginationParams): Promise<SeasonListResult>;
  findByLeagueId(leagueId: LeagueId): Promise<Season[]>;
  save(season: Season): Promise<void>;
  delete(id: SeasonId): Promise<void>;
}
