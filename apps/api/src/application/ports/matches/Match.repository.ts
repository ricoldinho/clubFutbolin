import type { Match } from '@/domain/matches/Match.entity';
import type { MatchId } from '@/domain/matches/MatchId.value-object';
import type { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import type { PaginationParams } from '@/shared/pagination';

/**
 * Filtros de búsqueda de partidos por temporada.
 * Incluye paginación obligatoria y filtro opcional por jornada.
 */
export interface MatchListFilters extends PaginationParams {
  readonly round?: number;
}

/**
 * Resultado paginado de listado de partidos.
 */
export interface MatchListResult {
  readonly data: Match[];
  readonly total: number;
}

/**
 * Puerto de repositorio para el agregado Match.
 * Define operaciones de consulta y persistencia para calendario y resultados.
 */
export interface IMatchRepository {
  /**
   * Indica si una temporada ya tiene al menos un partido generado.
   */
  existsBySeasonId(seasonId: SeasonId): Promise<boolean>;
  /**
   * Recupera un partido por id o null si no existe.
   */
  findById(matchId: MatchId): Promise<Match | null>;
  /**
   * Lista partidos de temporada con filtros de paginación y jornada.
   */
  findBySeasonId(seasonId: SeasonId, filters: MatchListFilters): Promise<MatchListResult>;
  /**
   * Persiste un partido (create/update).
   */
  save(match: Match): Promise<void>;
  /**
   * Persiste una colección de partidos en lote.
   */
  saveMany(matches: readonly Match[]): Promise<void>;
  /**
   * Actualiza la fecha de todos los partidos de una jornada concreta de la season.
   * Devuelve cuántos partidos fueron actualizados.
   */
  updateRoundDate(seasonId: SeasonId, round: number, date: Date): Promise<number>;
}
