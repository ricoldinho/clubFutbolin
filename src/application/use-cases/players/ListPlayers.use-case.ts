import { Player } from '@/domain/players/Player.entity';
import type { IPlayerRepository } from '@/application/ports/players/Player.repository';

/**
 * Lista todos los Players.
 * Más adelante se puede extender con paginación y filtros.
 */
export class ListPlayers {
  constructor(private readonly repository: IPlayerRepository) {}

  async execute(): Promise<Player[]> {
    const players = await this.repository.findAll();
    return players;
  }
}

