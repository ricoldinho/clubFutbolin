import { Player } from '@/domain/players/Player.entity';
import { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';
import type { IPlayerRepository } from '@/application/ports/players/Player.repository';

/**
 * Obtiene un Player por su identificador.
 * Devuelve null si no existe; la capa HTTP es responsable de traducirlo a 404.
 */
export class GetPlayerById {
  constructor(private readonly repository: IPlayerRepository) {}

  async execute(id: PlayerId): Promise<Player | null> {
    const player = await this.repository.findById(id);
    return player;
  }
}

