import { Player } from '@/domain/players/Player.entity';
import type { IPlayerRepository } from '@/application/ports/players/Player.repository';
import { Result } from '@/shared/result';

/**
 * Lista todos los Players.
 * Más adelante se puede extender con paginación y filtros.
 * Devuelve siempre Result.ok; errores de infra se propagan y se capturan en HTTP.
 */
export class ListPlayers {
  constructor(private readonly repository: IPlayerRepository) {}

  async execute(): Promise<Result<Player[], never>> {
    const players = await this.repository.findAll();
    return Result.ok(players);
  }
}

