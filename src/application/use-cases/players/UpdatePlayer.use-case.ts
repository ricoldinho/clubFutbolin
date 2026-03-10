import { Player } from '@/domain/players/Player.entity';
import type { IPlayerRepository } from '@/application/ports/players/Player.repository';
import { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';
import { EmailAlreadyInUseError } from '@/domain/players/errors';
import { NotFoundError } from '@/domain/shared/errors';
import type { Email } from '@/domain/players/value-objects/Email.value-object';
import type { PhoneNumber } from '@/domain/players/value-objects/PhoneNumber.value-object';
import type { Birthdate } from '@/domain/players/value-objects/Birthdate.value-object';
import type { PlayerCategory } from '@/domain/players/PlayerCategory';
import { Result } from '@/shared/result';

export interface UpdatePlayerInput {
  id: PlayerId;
  name?: string;
  lastname?: string;
  nickname?: string | null;
  email?: Email;
  phoneNumber?: PhoneNumber;
  league?: string[];
  birthdate?: Birthdate;
  category?: PlayerCategory;
}

type UpdatePlayerError = NotFoundError | EmailAlreadyInUseError;

/**
 * Actualiza los datos de un Player existente.
 * - Si no existe, devuelve Result.fail(NotFoundError) (HTTP → 404).
 * - Si el nuevo email ya está en uso por otro Player, devuelve Result.fail(EmailAlreadyInUseError) (HTTP → 409).
 */
export class UpdatePlayer {
  constructor(private readonly repository: IPlayerRepository) {}

  async execute(input: UpdatePlayerInput): Promise<Result<Player, UpdatePlayerError>> {
    const existing = await this.repository.findById(input.id);
    if (existing === null) {
      return Result.fail(new NotFoundError('Player', input.id.value));
    }

    if (input.email !== undefined) {
      const byEmail = await this.repository.findByEmail(input.email);
      if (
        byEmail !== null &&
        byEmail.id !== undefined &&
        !byEmail.id.equals(input.id)
      ) {
        return Result.fail(new EmailAlreadyInUseError(input.email.value));
      }
    }

    const updated = Player.create({
      id: input.id,
      name: input.name ?? existing.name,
      lastname: input.lastname ?? existing.lastname,
      nickname: input.nickname !== undefined ? input.nickname : existing.nickname,
      email: input.email ?? existing.email,
      phoneNumber: input.phoneNumber ?? existing.phoneNumber,
      league: input.league !== undefined ? input.league : existing.league,
      birthdate: input.birthdate ?? existing.birthdate,
      category: input.category ?? existing.category,
    });

    await this.repository.save(updated);
    return Result.ok(updated);
  }
}

