import type { Team } from '@/domain/teams/Team.entity';
import type { TeamId } from '@/domain/teams/TeamId.value-object';
import type { PaginationParams } from '@/shared/pagination';

export interface TeamListResult {
  readonly data: Team[];
  readonly total: number;
}

/** Filtros opcionales para el listado paginado de equipos. */
export interface ListTeamsFilters {
  /** Coincidencia parcial (sin distinguir mayúsculas) en el nombre del equipo. */
  readonly searchQuery?: string;
}

export interface ITeamRepository {
  findById(id: TeamId): Promise<Team | null>;
  findByName(name: string): Promise<Team | null>;
  findAll(): Promise<Team[]>;
  findAll(
    pagination: PaginationParams,
    filters?: ListTeamsFilters,
  ): Promise<TeamListResult>;
  save(team: Team): Promise<void>;
  delete(id: TeamId): Promise<void>;
}
