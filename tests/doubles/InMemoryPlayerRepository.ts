import type { IPlayerRepository } from '@/modules/players/domain/Player.repository';
import { Player } from '@/modules/players/domain/Player.entity';
import type { Email } from '@/modules/players/domain/value-objects/Email.value-object';
import type { PlayerId } from '@/modules/players/domain/value-objects/PlayerId.value-object';

/**
 * Fake del repositorio de Player para tests. Almacena en memoria; findByEmail por valor de email.
 */
export class InMemoryPlayerRepository implements IPlayerRepository {
  private readonly players: Player[] = [];

  async findByEmail(email: Email): Promise<Player | null> {
    return this.players.find((p) => p.email.equals(email)) ?? null;
  }

  async findById(id: PlayerId): Promise<Player | null> {
    return this.players.find((p) => p.id?.equals(id)) ?? null;
  }

  async save(player: Player): Promise<void> {
    this.players.push(player);
  }
}
