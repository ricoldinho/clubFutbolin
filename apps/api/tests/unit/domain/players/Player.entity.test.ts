import { describe, it, expect } from 'vitest';
import { Player } from '@/domain/players/Player.entity';
import { PlayerCategory } from '@/domain/players/PlayerCategory';
import { PlayerRole } from '@/domain/players/PlayerRole';
import { Email } from '@/domain/players/value-objects/Email.value-object';
import { PhoneNumber } from '@/domain/players/value-objects/PhoneNumber.value-object';
import { Birthdate } from '@/domain/players/value-objects/Birthdate.value-object';
import { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';

describe('Player', () => {
  const baseProps = {
    name: 'Luis',
    lastname: 'García',
    nickname: 'Luigi',
    email: Email.create('luis.garcia@example.com'),
    phoneNumber: PhoneNumber.create('+34 612 345 678'),
    birthdate: Birthdate.create('2005-03-15'),
    category: PlayerCategory.PRIMERA,
    role: PlayerRole.USER,
  };

  it('debe crear un Player con todas las propiedades', () => {
    // Arrange
    const props = { ...baseProps };

    // Act
    const player = Player.create(props);

    // Assert
    expect(player.name).toBe('Luis');
    expect(player.lastname).toBe('García');
    expect(player.nickname).toBe('Luigi');
    expect(player.email.value).toBe('luis.garcia@example.com');
    expect(player.phoneNumber.value).toBe('34612345678');
    expect(player.birthdate.value).toEqual(new Date('2005-03-15'));
    expect(player.category).toBe(PlayerCategory.PRIMERA);
    expect(player.id).toBeUndefined();
  });

  it('debe crear un Player con id cuando se pasa en las props', () => {
    // Arrange
    const id = PlayerId.fromString('550e8400-e29b-41d4-a716-446655440000');
    const props = { ...baseProps, id };

    // Act
    const player = Player.create(props);

    // Assert
    expect(player.id).toBeDefined();
    expect(player.id?.value).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('debe devolver fullName como nombre y apellido concatenados', () => {
    // Arrange
    const player = Player.create(baseProps);

    // Act
    const fullName = player.fullName;

    // Assert
    expect(fullName).toBe('Luis García');
  });

  it('debe aceptar nickname null', () => {
    // Arrange
    const props = { ...baseProps, nickname: null };

    // Act
    const player = Player.create(props);

    // Assert
    expect(player.nickname).toBeNull();
  });
});
