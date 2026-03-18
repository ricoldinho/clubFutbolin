import { describe, it, expect } from 'vitest';
import { UpdatePlayer } from '@/application/use-cases/players/UpdatePlayer.use-case';
import { InMemoryPlayerRepository } from '../../../../doubles/InMemoryPlayerRepository';
import { FakePasswordHasher } from '../../../../doubles/FakePasswordHasher';
import { PlayerRole } from '@/domain/players/PlayerRole';
import { PlayerCategory } from '@/domain/players/PlayerCategory';
import { Email } from '@/domain/players/value-objects/Email.value-object';
import { PhoneNumber } from '@/domain/players/value-objects/PhoneNumber.value-object';
import { Birthdate } from '@/domain/players/value-objects/Birthdate.value-object';
import { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';
import { NotFoundError, ForbiddenError } from '@/domain/shared/errors';
import { EmailAlreadyInUseError } from '@/domain/players/errors';
import { RegisterPlayer } from '@/application/use-cases/players/RegisterPlayer.use-case';
import { isOk } from '@/shared/result';

describe('UpdatePlayer', () => {
  it('actualiza los campos de un Player existente y devuelve Result.ok', async () => {
    // Arrange
    const repository = new InMemoryPlayerRepository();
    const registerPlayer = new RegisterPlayer(repository, new FakePasswordHasher());
    const updatePlayer = new UpdatePlayer(repository);
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
    const result = await updatePlayer.execute({
      id: playerId,
      actor,
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
    const actor = { id: PlayerId.generate(), role: PlayerRole.USER };

    // Act
    const result = await updatePlayer.execute({
      id: fakeId,
      actor,
      name: 'Nuevo nombre',
    });

    // Assert
    expect(isOk(result)).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(NotFoundError);
  });

  it('devuelve Result.fail(EmailAlreadyInUseError) cuando el nuevo email ya está en uso', async () => {
    // Arrange
    const repository = new InMemoryPlayerRepository();
    const registerPlayer = new RegisterPlayer(repository, new FakePasswordHasher());
    const updatePlayer = new UpdatePlayer(repository);

    const props1 = {
      name: 'Jugador 1',
      lastname: 'Uno',
      nickname: null,
      email: Email.create('one@example.com'),
      phoneNumber: PhoneNumber.create('+34600000001'),
      birthdate: Birthdate.create('2000-01-01'),
      category: PlayerCategory.PRIMERA,
      password: 'password1',
    };
    const props2 = {
      name: 'Jugador 2',
      lastname: 'Dos',
      nickname: null,
      email: Email.create('two@example.com'),
      phoneNumber: PhoneNumber.create('+34600000002'),
      birthdate: Birthdate.create('2001-02-02'),
      category: PlayerCategory.SEGUNDA,
      password: 'password2',
    };

    const r1 = await registerPlayer.execute(props1);
    const r2 = await registerPlayer.execute(props2);
    if (!isOk(r1) || !isOk(r2)) throw new Error('Expected both registers to succeed');
    const player2Id = r2.value.id as PlayerId;
    const actor = { id: player2Id, role: PlayerRole.USER };

    // Act
    const result = await updatePlayer.execute({
      id: player2Id,
      actor,
      email: props1.email,
    });

    // Assert
    expect(isOk(result)).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(EmailAlreadyInUseError);
  });

  it('devuelve Result.fail(ForbiddenError) cuando un USER intenta actualizar otro jugador (no es self ni admin)', async () => {
    // Arrange
    const repository = new InMemoryPlayerRepository();
    const registerPlayer = new RegisterPlayer(repository, new FakePasswordHasher());
    const updatePlayer = new UpdatePlayer(repository);
    const r1 = await registerPlayer.execute({
      name: 'Jugador 1',
      lastname: 'Uno',
      nickname: null,
      email: Email.create('one@example.com'),
      phoneNumber: PhoneNumber.create('+34600000001'),
      birthdate: Birthdate.create('2000-01-01'),
      category: PlayerCategory.PRIMERA,
      password: 'password1',
    });
    const r2 = await registerPlayer.execute({
      name: 'Jugador 2',
      lastname: 'Dos',
      nickname: null,
      email: Email.create('two@example.com'),
      phoneNumber: PhoneNumber.create('+34600000002'),
      birthdate: Birthdate.create('2001-02-02'),
      category: PlayerCategory.SEGUNDA,
      password: 'password2',
    });
    if (!isOk(r1) || !isOk(r2)) throw new Error('Expected both registers to succeed');
    const player1Id = r1.value.id as PlayerId;
    const player2Id = r2.value.id as PlayerId;
    const actor = { id: player1Id, role: PlayerRole.USER };

    // Act: player1 (USER) intenta cambiar el nombre de player2
    const result = await updatePlayer.execute({
      id: player2Id,
      actor,
      name: 'Nombre pirateado',
    });

    // Assert
    expect(isOk(result)).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(ForbiddenError);
  });

  it('devuelve Result.fail(ForbiddenError) cuando un USER intenta asignar role ADMIN', async () => {
    // Arrange
    const repository = new InMemoryPlayerRepository();
    const registerPlayer = new RegisterPlayer(repository, new FakePasswordHasher());
    const updatePlayer = new UpdatePlayer(repository);
    const props = {
      name: 'Luis',
      lastname: 'García',
      nickname: null,
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
    const result = await updatePlayer.execute({
      id: playerId,
      actor,
      role: PlayerRole.ADMIN,
    });

    // Assert
    expect(isOk(result)).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(ForbiddenError);
  });
});

