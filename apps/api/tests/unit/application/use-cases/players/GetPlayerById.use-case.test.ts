import { describe, it, expect } from 'vitest';
import { GetPlayerById } from '@/application/use-cases/players/GetPlayerById.use-case';
import { InMemoryPlayerRepository } from '../../../../doubles/InMemoryPlayerRepository';
import { FakePasswordHasher } from '../../../../doubles/FakePasswordHasher';
import { PlayerRole } from '@/domain/players/PlayerRole';
import { PlayerCategory } from '@/domain/players/PlayerCategory';
import { Email } from '@/domain/players/value-objects/Email.value-object';
import { PhoneNumber } from '@/domain/players/value-objects/PhoneNumber.value-object';
import { Birthdate } from '@/domain/players/value-objects/Birthdate.value-object';
import { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';
import { NotFoundError } from '@/domain/shared/errors';
import { isOk } from '@/shared/result';
import { RegisterPlayer } from '@/application/use-cases/players/RegisterPlayer.use-case';

describe('GetPlayerById', () => {
  it('devuelve Result.ok(Player) cuando el Player existe y el actor es el mismo', async () => {
    // Arrange
    const repository = new InMemoryPlayerRepository();
    const registerPlayer = new RegisterPlayer(repository, new FakePasswordHasher());
    const getPlayerById = new GetPlayerById(repository);
    const props = {
      name: 'Luis',
      lastname: 'García',
      nickname: 'Luigi',
      email: Email.create('luis@example.com'),
      phoneNumber: PhoneNumber.create('+34612345678'),
      birthdate: Birthdate.create('2005-03-15'),
      category: PlayerCategory.PRIMERA,
      password: 'password123',
    };
    const registerResult = await registerPlayer.execute(props);
    if (!isOk(registerResult)) throw new Error('Expected register to succeed');
    const playerId = registerResult.value.id as PlayerId;
    const actor = { id: playerId, role: PlayerRole.USER };

    // Act
    const result = await getPlayerById.execute(playerId, actor);

    // Assert
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.id?.value).toBe(playerId.value);
    expect(result.value.email.value).toBe('luis@example.com');
  });

  it('devuelve Result.fail(NotFoundError) cuando el Player no existe', async () => {
    // Arrange
    const repository = new InMemoryPlayerRepository();
    const getPlayerById = new GetPlayerById(repository);
    const id = PlayerId.generate();
    const actor = { id: PlayerId.generate(), role: PlayerRole.USER };

    // Act
    const result = await getPlayerById.execute(id, actor);

    // Assert
    expect(isOk(result)).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(NotFoundError);
    expect(result.error.message).toContain('Player');
  });
});
