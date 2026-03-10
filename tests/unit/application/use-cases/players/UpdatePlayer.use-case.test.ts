import { describe, it, expect } from 'vitest';
import { UpdatePlayer } from '@/application/use-cases/players/UpdatePlayer.use-case';
import { InMemoryPlayerRepository } from '../../../../doubles/InMemoryPlayerRepository';
import { PlayerCategory } from '@/domain/players/PlayerCategory';
import { Email } from '@/domain/players/value-objects/Email.value-object';
import { PhoneNumber } from '@/domain/players/value-objects/PhoneNumber.value-object';
import { Birthdate } from '@/domain/players/value-objects/Birthdate.value-object';
import { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';
import { NotFoundError } from '@/domain/shared/errors';
import { EmailAlreadyInUseError } from '@/domain/players/errors';
import { RegisterPlayer } from '@/application/use-cases/players/RegisterPlayer.use-case';
import { isOk } from '@/shared/result';

describe('UpdatePlayer', () => {
  it('actualiza los campos de un Player existente y devuelve Result.ok', async () => {
    // Arrange
    const repository = new InMemoryPlayerRepository();
    const registerPlayer = new RegisterPlayer(repository);
    const updatePlayer = new UpdatePlayer(repository);
    const props = {
      name: 'Luis',
      lastname: 'García',
      nickname: 'Luigi',
      email: Email.create('luis@example.com'),
      phoneNumber: PhoneNumber.create('+34612345678'),
      league: ['Liga Provincial'],
      birthdate: Birthdate.create('2005-03-15'),
      category: PlayerCategory.PRIMERA,
    };
    const registerResult = await registerPlayer.execute(props);
    if (!isOk(registerResult)) throw new Error('Expected register to succeed');
    const playerId = registerResult.value.id as PlayerId;

    // Act
    const result = await updatePlayer.execute({
      id: playerId,
      name: 'Luis Actualizado',
      nickname: null,
    });

    // Assert
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.name).toBe('Luis Actualizado');
    expect(result.value.nickname).toBeNull();
  });

  it('devuelve Result.fail(NotFoundError) cuando el Player no existe', async () => {
    // Arrange
    const repository = new InMemoryPlayerRepository();
    const updatePlayer = new UpdatePlayer(repository);
    const fakeId = PlayerId.generate();

    // Act
    const result = await updatePlayer.execute({ id: fakeId, name: 'Nuevo nombre' });

    // Assert
    expect(isOk(result)).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(NotFoundError);
  });

  it('devuelve Result.fail(EmailAlreadyInUseError) cuando el nuevo email ya está en uso', async () => {
    // Arrange
    const repository = new InMemoryPlayerRepository();
    const registerPlayer = new RegisterPlayer(repository);
    const updatePlayer = new UpdatePlayer(repository);

    const props1 = {
      name: 'Jugador 1',
      lastname: 'Uno',
      nickname: null,
      email: Email.create('one@example.com'),
      phoneNumber: PhoneNumber.create('+34600000001'),
      league: ['Liga 1'],
      birthdate: Birthdate.create('2000-01-01'),
      category: PlayerCategory.PRIMERA,
    };
    const props2 = {
      name: 'Jugador 2',
      lastname: 'Dos',
      nickname: null,
      email: Email.create('two@example.com'),
      phoneNumber: PhoneNumber.create('+34600000002'),
      league: ['Liga 2'],
      birthdate: Birthdate.create('2001-02-02'),
      category: PlayerCategory.SEGUNDA,
    };

    const r1 = await registerPlayer.execute(props1);
    const r2 = await registerPlayer.execute(props2);
    if (!isOk(r1) || !isOk(r2)) throw new Error('Expected both registers to succeed');
    const player2Id = r2.value.id as PlayerId;

    // Act
    const result = await updatePlayer.execute({
      id: player2Id,
      email: props1.email,
    });

    // Assert
    expect(isOk(result)).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(EmailAlreadyInUseError);
  });
});

