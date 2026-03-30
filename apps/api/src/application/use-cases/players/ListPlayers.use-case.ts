import type {
  IPlayerRepository,
  PlayerListResult,
} from '@/application/ports/players/Player.repository';
import { Result } from '@/shared/result';
import type { PaginationParams } from '@/shared/pagination';

export interface ListPlayersInput {
  readonly pagination: PaginationParams;
}

/**
 * Lista Players. Sin paginación devuelve el listado completo; con paginación, una ventana acotada.
 * Devuelve siempre Result.ok; errores de infra se propagan y se capturan en HTTP.
 */
export class ListPlayers {
  constructor(private readonly playerRepository: IPlayerRepository) {}

  async execute(input: ListPlayersInput): Promise<Result<PlayerListResult, never>> {
    const players = await this.playerRepository.findAll(input.pagination);
    return Result.ok(players);
  }
}

