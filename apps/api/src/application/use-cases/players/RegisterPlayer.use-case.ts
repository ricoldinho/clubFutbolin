import { Player } from '@/domain/players/Player.entity';
import type { PlayerProps } from '@/domain/players/Player.entity';
import type { IPlayerRepository } from '@/application/ports/players/Player.repository';
import type { IPasswordHasher } from '@/application/ports/auth/PasswordHasher.port';
import { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';
import { PlayerRole } from '@/domain/players/PlayerRole';
import { EmailAlreadyInUseError } from '@/domain/players/errors';
import { Result } from '@/shared/result';

/**
 * Input para registro: datos del Player sin role (siempre USER) y contraseña en claro.
 */
export type RegisterPlayerInput = Omit<PlayerProps, 'role'> & { password: string };

/**
 * Registra un nuevo Player con role USER. Garantiza la invariante: un email solo puede pertenecer a un Player.
 * Si el email ya existe, devuelve Result.fail(EmailAlreadyInUseError) (en HTTP → 409 Conflict).
 * La contraseña se hashea antes de persistir; nunca se guarda en claro.
 */
export class RegisterPlayer {
  constructor(
    private readonly repository: IPlayerRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(
    input: RegisterPlayerInput,
  ): Promise<Result<Player, EmailAlreadyInUseError>> {
    const { password, ...props } = input;
    const existing = await this.repository.findByEmail(props.email);
    if (existing !== null) {
      return Result.fail(new EmailAlreadyInUseError(props.email.value));
    }
    const passwordHash = await this.passwordHasher.hash(password);
    const player = Player.create({
      ...props,
      role: PlayerRole.USER,
      id: PlayerId.generate(),
    });
    await this.repository.save(player, passwordHash);
    return Result.ok(player);
  }
}
