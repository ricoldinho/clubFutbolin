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

  /**
   * Temporada con año más alto; si hay empate, la de menor id (UUID lexicográfico).
   * Sirve para inscribir equipos nuevos con plantilla inicial sin exigir seasonId en el cliente.
   */
  findLatestByYear(): Promise<Season | null>;

  findAll(): Promise<Season[]>;
  findAll(pagination: PaginationParams): Promise<SeasonListResult>;
  findByLeagueId(leagueId: LeagueId): Promise<Season[]>;
  save(season: Season): Promise<void>;
  delete(id: SeasonId): Promise<void>;
}
