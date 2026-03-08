import { describe, it, expect } from 'vitest';
import { registerPlayer } from '@/modules/players/application/RegisterPlayer.use-case';
import { InMemoryPlayerRepository } from '../../../../doubles/InMemoryPlayerRepository';
import { PlayerCategory } from '@/modules/players/domain/PlayerCategory';
import { Email } from '@/modules/players/domain/value-objects/Email.value-object';
import { PhoneNumber } from '@/modules/players/domain/value-objects/PhoneNumber.value-object';
import { Birthdate } from '@/modules/players/domain/value-objects/Birthdate.value-object';
import { EmailAlreadyInUseError } from '@/modules/players/domain/errors';

describe('registerPlayer', () => {
  const baseProps = {
    name: 'Luis',
    lastname: 'García',
    nickname: 'Luigi',
    email: Email.create('luis@example.com'),
    phoneNumber: PhoneNumber.create('+34612345678'),
    league: ['Liga Provincial'],
    birthdate: Birthdate.create('2005-03-15'),
    category: PlayerCategory.PRIMERA,
  };

  it('debe registrar un Player y persistirlo', async () => {
    // Arrange
    const repository = new InMemoryPlayerRepository();

    // Act
    const player = await registerPlayer(repository, baseProps);

    // Assert
    expect(player.email.value).toBe('luis@example.com');
    expect(player.id).toBeDefined();
    const found = await repository.findByEmail(baseProps.email);
    expect(found).not.toBeNull();
    expect(found?.email.value).toBe('luis@example.com');
  });

  it('debe lanzar EmailAlreadyInUseError si el email ya está registrado', async () => {
    // Arrange
    const repository = new InMemoryPlayerRepository();
    await registerPlayer(repository, baseProps);

    // Act & Assert
    await expect(
      registerPlayer(repository, { ...baseProps, name: 'Otro' })
    ).rejects.toThrow(EmailAlreadyInUseError);
  });
});
