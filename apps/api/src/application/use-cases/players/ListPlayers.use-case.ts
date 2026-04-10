import type {
  IPlayerRepository,
  PlayerListResult,
} from '@/application/ports/players/Player.repository';
import { Result } from '@/shared/result';
import type { PaginationParams } from '@/shared/pagination';

export interface ListPlayersInput {
  readonly pagination: PaginationParams;
  /** Búsqueda por nombre, apellidos o alias (coincidencia parcial, sin distinguir mayúsculas en BD). */
  readonly searchQuery?: string;
}

/**
 * Lista Players paginados con total para metadata.
 * Opcionalmente filtra por texto en nombre, apellidos o alias.
 * Devuelve siempre Result.ok; errores de infra se propagan y se capturan en HTTP.
 */
export class ListPlayers {
  constructor(private readonly playerRepository: IPlayerRepository) {}

  async execute(input: ListPlayersInput): Promise<Result<PlayerListResult, never>> {
    const filters =
      input.searchQuery !== undefined && input.searchQuery.length > 0
        ? { searchQuery: input.searchQuery }
        : undefined;
    const players = await this.playerRepository.findAll(input.pagination, filters);
    return Result.ok(players);
  }
}

