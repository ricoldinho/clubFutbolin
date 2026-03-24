import type { Season } from '@/domain/seasons/Season.entity';
import type { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import type { LeagueId } from '@/domain/leagues/LeagueId.value-object';

export interface ISeasonRepository {
  findById(id: SeasonId): Promise<Season | null>;
  findAll(): Promise<Season[]>;
  findByLeagueId(leagueId: LeagueId): Promise<Season[]>;
  save(season: Season): Promise<void>;
  delete(id: SeasonId): Promise<void>;
}
