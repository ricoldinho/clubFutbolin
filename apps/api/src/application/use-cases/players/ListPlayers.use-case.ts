import { Player } from '@/domain/players/Player.entity';
import type {
  IPlayerRepository,
  PlayerListPagination,
} from '@/application/ports/players/Player.repository';
import { Result } from '@/shared/result';

export interface ListPlayersInput {
  readonly pagination?: PlayerListPagination;
}

/**
 * Lista Players. Sin paginación devuelve el listado completo; con paginación, una ventana acotada.
 * Devuelve siempre Result.ok; errores de infra se propagan y se capturan en HTTP.
 */
export class ListPlayers {
  constructor(private readonly repository: IPlayerRepository) {}

  async execute(input?: ListPlayersInput): Promise<Result<Player[], never>> {
    const players = await this.repository.findAll(input?.pagination);
    return Result.ok(players);
  }
}

