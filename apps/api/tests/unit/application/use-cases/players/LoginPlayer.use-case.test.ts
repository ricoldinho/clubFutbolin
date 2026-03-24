import { describe, it, expect } from 'vitest';
import { LoginPlayer } from '@/application/use-cases/players/LoginPlayer.use-case';
import { RegisterPlayer } from '@/application/use-cases/players/RegisterPlayer.use-case';
import { InMemoryPlayerRepository } from '../../../../doubles/InMemoryPlayerRepository';
import { FakePasswordHasher } from '../../../../doubles/FakePasswordHasher';
import { JoseJwtService } from '@/adapters/auth/JoseJwtService';
import { PlayerCategory } from '@/domain/players/PlayerCategory';
import { Email } from '@/domain/players/value-objects/Email.value-object';
import { PhoneNumber } from '@/domain/players/value-objects/PhoneNumber.value-object';
import { Birthdate } from '@/domain/players/value-objects/Birthdate.value-object';
import { InvalidCredentialsError } from '@/domain/players/errors';
import { isOk } from '@/shared/result';

const JWT_SECRET = 'test-secret';
const JWT_EXPIRES = '1h';

describe('LoginPlayer', () => {
  it('devuelve Result.fail(InvalidCredentialsError) cuando el email no existe', async () => {
    const repository = new InMemoryPlayerRepository();
    const passwordHasher = new FakePasswordHasher();
    const jwtService = new JoseJwtService(JWT_SECRET, JWT_EXPIRES);
    const loginPlayer = new LoginPlayer(repository, passwordHasher, jwtService);

    const result = await loginPlayer.execute({
      email: Email.create('noexiste@example.com'),
      password: 'cualquierpass',
    });

    expect(isOk(result)).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(InvalidCredentialsError);
  });

  it('devuelve Result.fail(InvalidCredentialsError) cuando la contraseña es incorrecta', async () => {
    const repository = new InMemoryPlayerRepository();
    const passwordHasher = new FakePasswordHasher();
    const registerPlayer = new RegisterPlayer(repository, passwordHasher);
    const loginPlayer = new LoginPlayer(repository, passwordHasher, new JoseJwtService(JWT_SECRET, JWT_EXPIRES));

    await registerPlayer.execute({
      name: 'Ana',
      lastname: 'López',
      nickname: null,
      email: Email.create('ana@example.com'),
      phoneNumber: PhoneNumber.create('612345678'),
      birthdate: Birthdate.create('1990-01-01'),
      category: PlayerCategory.PRIMERA,
      password: 'correctPassword',
    });

    const result = await loginPlayer.execute({
      email: Email.create('ana@example.com'),
      password: 'wrongPassword',
    });

    expect(isOk(result)).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(InvalidCredentialsError);
  });

  it('devuelve Result.ok con token y expiresIn cuando las credenciales son correctas', async () => {
    const repository = new InMemoryPlayerRepository();
    const passwordHasher = new FakePasswordHasher();
    const jwtService = new JoseJwtService(JWT_SECRET, JWT_EXPIRES);
    const registerPlayer = new RegisterPlayer(repository, passwordHasher);
    const loginPlayer = new LoginPlayer(repository, passwordHasher, jwtService);

    await registerPlayer.execute({
      name: 'Ana',
      lastname: 'López',
      nickname: null,
      email: Email.create('ana@example.com'),
      phoneNumber: PhoneNumber.create('612345678'),
      birthdate: Birthdate.create('1990-01-01'),
      category: PlayerCategory.PRIMERA,
      password: 'correctPassword',
    });

    const result = await loginPlayer.execute({
      email: Email.create('ana@example.com'),
      password: 'correctPassword',
    });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.token).toBeDefined();
    expect(typeof result.value.token).toBe('string');
    expect(result.value.expiresIn).toBe(JWT_EXPIRES);
    const payload = await jwtService.verify(result.value.token);
    expect(payload).not.toBeNull();
    expect(payload?.role).toBe('USER');
  });
});
