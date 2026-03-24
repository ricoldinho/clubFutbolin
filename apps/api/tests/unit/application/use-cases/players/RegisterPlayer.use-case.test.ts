import { describe, it, expect } from 'vitest';
import { RegisterPlayer } from '@/application/use-cases/players/RegisterPlayer.use-case';
import { InMemoryPlayerRepository } from '../../../../doubles/InMemoryPlayerRepository';
import { FakePasswordHasher } from '../../../../doubles/FakePasswordHasher';
import { PlayerCategory } from '@/domain/players/PlayerCategory';
import { Email } from '@/domain/players/value-objects/Email.value-object';
import { PhoneNumber } from '@/domain/players/value-objects/PhoneNumber.value-object';
import { Birthdate } from '@/domain/players/value-objects/Birthdate.value-object';
import { EmailAlreadyInUseError } from '@/domain/players/errors';
import { isOk } from '@/shared/result';

describe('RegisterPlayer', () => {
  const baseProps = {
    name: 'Luis',
    lastname: 'García',
    nickname: 'Luigi',
    email: Email.create('luis@example.com'),
    phoneNumber: PhoneNumber.create('+34612345678'),
    birthdate: Birthdate.create('2005-03-15'),
    category: PlayerCategory.PRIMERA,
    password: 'securepass123',
  };

  it('debe registrar un Player y persistirlo con role USER', async () => {
    // Arrange
    const repository = new InMemoryPlayerRepository();
    const useCase = new RegisterPlayer(repository, new FakePasswordHasher());

    // Act
    const result = await useCase.execute(baseProps);

    // Assert
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const player = result.value;
    expect(player.email.value).toBe('luis@example.com');
    expect(player.role).toBe('USER' as const);
    expect(player.id).toBeDefined();
    const found = await repository.findByEmail(baseProps.email);
    expect(found).not.toBeNull();
    expect(found?.email.value).toBe('luis@example.com');
  });

  it('debe devolver Result.fail(EmailAlreadyInUseError) si el email ya está registrado', async () => {
    // Arrange
    const repository = new InMemoryPlayerRepository();
    const useCase = new RegisterPlayer(repository, new FakePasswordHasher());
    await useCase.execute(baseProps);

    // Act
    const result = await useCase.execute({ ...baseProps, name: 'Otro' });

    // Assert
    expect(isOk(result)).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(EmailAlreadyInUseError);
  });
});
