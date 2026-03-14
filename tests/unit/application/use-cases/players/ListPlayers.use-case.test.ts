import { describe, it, expect } from 'vitest';
import { ListPlayers } from '@/application/use-cases/players/ListPlayers.use-case';
import { RegisterPlayer } from '@/application/use-cases/players/RegisterPlayer.use-case';
import { InMemoryPlayerRepository } from '../../../../doubles/InMemoryPlayerRepository';
import { FakePasswordHasher } from '../../../../doubles/FakePasswordHasher';
import { PlayerCategory } from '@/domain/players/PlayerCategory';
import { Email } from '@/domain/players/value-objects/Email.value-object';
import { PhoneNumber } from '@/domain/players/value-objects/PhoneNumber.value-object';
import { Birthdate } from '@/domain/players/value-objects/Birthdate.value-object';
import { isOk } from '@/shared/result';

describe('ListPlayers', () => {
  it('devuelve Result.ok([]) cuando no hay jugadores', async () => {
    // Arrange
    const repository = new InMemoryPlayerRepository();
    const listPlayers = new ListPlayers(repository);

    // Act
    const result = await listPlayers.execute();

    // Assert
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toEqual([]);
    expect(result.value).toHaveLength(0);
  });

  it('devuelve Result.ok(players) con los jugadores guardados', async () => {
    // Arrange
    const repository = new InMemoryPlayerRepository();
    const registerPlayer = new RegisterPlayer(repository, new FakePasswordHasher());
    const listPlayers = new ListPlayers(repository);
    const props1 = {
      name: 'Ana',
      lastname: 'López',
      nickname: null,
      email: Email.create('ana@example.com'),
      phoneNumber: PhoneNumber.create('612345678'),
      league: ['Liga A'],
      birthdate: Birthdate.create('1998-01-10'),
      category: PlayerCategory.TERCERA,
      password: 'password1',
    };
    const props2 = {
      name: 'Bruno',
      lastname: 'Martín',
      nickname: 'Bru',
      email: Email.create('bruno@example.com'),
      phoneNumber: PhoneNumber.create('698765432'),
      league: ['Liga B'],
      birthdate: Birthdate.create('2000-05-20'),
      category: PlayerCategory.SEGUNDA,
      password: 'password2',
    };
    await registerPlayer.execute(props1);
    await registerPlayer.execute(props2);

    // Act
    const result = await listPlayers.execute();

    // Assert
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toHaveLength(2);
    const emails = result.value.map((p) => p.email.value).sort();
    expect(emails).toEqual(['ana@example.com', 'bruno@example.com']);
    expect(result.value.map((p) => p.name).sort()).toEqual(['Ana', 'Bruno']);
  });
});
