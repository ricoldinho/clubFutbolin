"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const LoginPlayer_use_case_1 = require("@/application/use-cases/players/LoginPlayer.use-case");
const RegisterPlayer_use_case_1 = require("@/application/use-cases/players/RegisterPlayer.use-case");
const InMemoryPlayerRepository_1 = require("../../../../doubles/InMemoryPlayerRepository");
const FakePasswordHasher_1 = require("../../../../doubles/FakePasswordHasher");
const JoseJwtService_1 = require("@/adapters/auth/JoseJwtService");
const PlayerCategory_1 = require("@/domain/players/PlayerCategory");
const Email_value_object_1 = require("@/domain/players/value-objects/Email.value-object");
const PhoneNumber_value_object_1 = require("@/domain/players/value-objects/PhoneNumber.value-object");
const Birthdate_value_object_1 = require("@/domain/players/value-objects/Birthdate.value-object");
const errors_1 = require("@/domain/players/errors");
const result_1 = require("@/shared/result");
const JWT_SECRET = 'test-secret';
const JWT_EXPIRES = '1h';
(0, vitest_1.describe)('LoginPlayer', () => {
    (0, vitest_1.it)('devuelve Result.fail(InvalidCredentialsError) cuando el email no existe', async () => {
        const repository = new InMemoryPlayerRepository_1.InMemoryPlayerRepository();
        const passwordHasher = new FakePasswordHasher_1.FakePasswordHasher();
        const jwtService = new JoseJwtService_1.JoseJwtService(JWT_SECRET, JWT_EXPIRES);
        const loginPlayer = new LoginPlayer_use_case_1.LoginPlayer(repository, passwordHasher, jwtService);
        const result = await loginPlayer.execute({
            email: Email_value_object_1.Email.create('noexiste@example.com'),
            password: 'cualquierpass',
        });
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error).toBeInstanceOf(errors_1.InvalidCredentialsError);
    });
    (0, vitest_1.it)('devuelve Result.fail(InvalidCredentialsError) cuando la contraseña es incorrecta', async () => {
        const repository = new InMemoryPlayerRepository_1.InMemoryPlayerRepository();
        const passwordHasher = new FakePasswordHasher_1.FakePasswordHasher();
        const registerPlayer = new RegisterPlayer_use_case_1.RegisterPlayer(repository, passwordHasher);
        const loginPlayer = new LoginPlayer_use_case_1.LoginPlayer(repository, passwordHasher, new JoseJwtService_1.JoseJwtService(JWT_SECRET, JWT_EXPIRES));
        await registerPlayer.execute({
            name: 'Ana',
            lastname: 'López',
            nickname: null,
            email: Email_value_object_1.Email.create('ana@example.com'),
            phoneNumber: PhoneNumber_value_object_1.PhoneNumber.create('612345678'),
            birthdate: Birthdate_value_object_1.Birthdate.create('1990-01-01'),
            category: PlayerCategory_1.PlayerCategory.PRIMERA,
            password: 'correctPassword',
        });
        const result = await loginPlayer.execute({
            email: Email_value_object_1.Email.create('ana@example.com'),
            password: 'wrongPassword',
        });
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error).toBeInstanceOf(errors_1.InvalidCredentialsError);
    });
    (0, vitest_1.it)('devuelve Result.ok con token y expiresIn cuando las credenciales son correctas', async () => {
        const repository = new InMemoryPlayerRepository_1.InMemoryPlayerRepository();
        const passwordHasher = new FakePasswordHasher_1.FakePasswordHasher();
        const jwtService = new JoseJwtService_1.JoseJwtService(JWT_SECRET, JWT_EXPIRES);
        const registerPlayer = new RegisterPlayer_use_case_1.RegisterPlayer(repository, passwordHasher);
        const loginPlayer = new LoginPlayer_use_case_1.LoginPlayer(repository, passwordHasher, jwtService);
        await registerPlayer.execute({
            name: 'Ana',
            lastname: 'López',
            nickname: null,
            email: Email_value_object_1.Email.create('ana@example.com'),
            phoneNumber: PhoneNumber_value_object_1.PhoneNumber.create('612345678'),
            birthdate: Birthdate_value_object_1.Birthdate.create('1990-01-01'),
            category: PlayerCategory_1.PlayerCategory.PRIMERA,
            password: 'correctPassword',
        });
        const result = await loginPlayer.execute({
            email: Email_value_object_1.Email.create('ana@example.com'),
            password: 'correctPassword',
        });
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(true);
        if (!(0, result_1.isOk)(result))
            return;
        (0, vitest_1.expect)(result.value.token).toBeDefined();
        (0, vitest_1.expect)(typeof result.value.token).toBe('string');
        (0, vitest_1.expect)(result.value.playerId).toBeDefined();
        (0, vitest_1.expect)(result.value.role).toBe('USER');
        (0, vitest_1.expect)(result.value.expiresIn).toBe(JWT_EXPIRES);
        const payload = await jwtService.verify(result.value.token);
        (0, vitest_1.expect)(payload).not.toBeNull();
        (0, vitest_1.expect)(payload?.role).toBe('USER');
        (0, vitest_1.expect)(payload?.tokenType).toBe('access');
    });
});
