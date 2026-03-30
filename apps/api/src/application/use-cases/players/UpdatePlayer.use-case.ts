import { Player } from '@/domain/players/Player.entity';
import type { IPlayerRepository } from '@/application/ports/players/Player.repository';
import { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';
import { EmailAlreadyInUseError } from '@/domain/players/errors';
import { NotFoundError, ForbiddenError } from '@/domain/shared/errors';
import type { Email } from '@/domain/players/value-objects/Email.value-object';
import type { PhoneNumber } from '@/domain/players/value-objects/PhoneNumber.value-object';
import type { Birthdate } from '@/domain/players/value-objects/Birthdate.value-object';
import type { PlayerCategory } from '@/domain/players/PlayerCategory';
import { PlayerRole } from '@/domain/players/PlayerRole';
import { Result } from '@/shared/result';

export interface UpdatePlayerActor {
  id: PlayerId;
  role: PlayerRole;
}

export interface UpdatePlayerInput {
  id: PlayerId;
  actor: UpdatePlayerActor;
  name?: string;
  lastname?: string;
  nickname?: string | null;
  email?: Email;
  phoneNumber?: PhoneNumber;
  birthdate?: Birthdate;
  category?: PlayerCategory;
  role?: PlayerRole;
}

type UpdatePlayerError = NotFoundError | EmailAlreadyInUseError | ForbiddenError;

/**
 * Actualiza los datos de un Player existente.
 * Solo el propio Player o un ADMIN pueden actualizar.
 * - Si no existe, devuelve Result.fail(NotFoundError) (HTTP → 404).
 * - Si el actor no tiene permiso (no es el propio jugador ni ADMIN), Result.fail(ForbiddenError) (HTTP → 403).
 * - Si el nuevo email ya está en uso por otro Player, devuelve Result.fail(EmailAlreadyInUseError) (HTTP → 409).
 * - Solo un actor con role ADMIN puede asignar role ADMIN a otro Player; si no, Result.fail(ForbiddenError) (HTTP → 403).
 */
export class UpdatePlayer {
  constructor(private readonly playerRepository: IPlayerRepository) {}

  async execute(input: UpdatePlayerInput): Promise<Result<Player, UpdatePlayerError>> {
    const existing = await this.playerRepository.findById(input.id);
    if (existing === null) {
      return Result.fail(new NotFoundError('Player', input.id.value));
    }

    const isSelf = input.actor.id.equals(input.id);
    const isAdmin = input.actor.role === PlayerRole.ADMIN;
    if (!isSelf && !isAdmin) {
      return Result.fail(new ForbiddenError());
    }

    if (input.role !== undefined && input.role === PlayerRole.ADMIN) {
      if (input.actor.role !== PlayerRole.ADMIN) {
        return Result.fail(
          new ForbiddenError('Solo un administrador puede asignar el rol ADMIN'),
        );
      }
    }

    if (input.email !== undefined) {
      const byEmail = await this.playerRepository.findByEmail(input.email);
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
      birthdate: input.birthdate ?? existing.birthdate,
      category: input.category ?? existing.category,
      role: input.role ?? existing.role,
    });

    await this.playerRepository.save(updated);
    return Result.ok(updated);
  }
}

