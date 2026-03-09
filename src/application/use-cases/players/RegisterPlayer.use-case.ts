import { Player } from '@/domain/players/Player.entity';
import type { PlayerProps } from '@/domain/players/Player.entity';
import type { IPlayerRepository } from '@/application/ports/players/Player.repository';
import { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';
import { EmailAlreadyInUseError } from '@/domain/players/errors';

/**
 * Registra un nuevo Player. Garantiza la invariante: un email solo puede pertenecer a un Player.
 * Si el email ya existe, lanza EmailAlreadyInUseError (en HTTP sería 409 Conflict).
 */
export class RegisterPlayer {
  constructor(private readonly repository: IPlayerRepository) {}

  async execute(props: PlayerProps): Promise<Player> {
    const existing = await this.repository.findByEmail(props.email);
    if (existing !== null) {
      throw new EmailAlreadyInUseError(props.email.value);
    }
    const player = Player.create({
      ...props,
      id: PlayerId.generate(),
    });
    await this.repository.save(player);
    return player;
  }
}
