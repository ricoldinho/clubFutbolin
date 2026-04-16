"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const RegisterPlayer_use_case_1 = require("@/application/use-cases/players/RegisterPlayer.use-case");
const InMemoryPlayerRepository_1 = require("../../../../doubles/InMemoryPlayerRepository");
const FakePasswordHasher_1 = require("../../../../doubles/FakePasswordHasher");
const PlayerCategory_1 = require("@/domain/players/PlayerCategory");
const Email_value_object_1 = require("@/domain/players/value-objects/Email.value-object");
const PhoneNumber_value_object_1 = require("@/domain/players/value-objects/PhoneNumber.value-object");
const Birthdate_value_object_1 = require("@/domain/players/value-objects/Birthdate.value-object");
const errors_1 = require("@/domain/players/errors");
const result_1 = require("@/shared/result");
(0, vitest_1.describe)('RegisterPlayer', () => {
    const baseProps = {
        name: 'Luis',
        lastname: 'García',
        nickname: 'Luigi',
        email: Email_value_object_1.Email.create('luis@example.com'),
        phoneNumber: PhoneNumber_value_object_1.PhoneNumber.create('+34612345678'),
        birthdate: Birthdate_value_object_1.Birthdate.create('2005-03-15'),
        category: PlayerCategory_1.PlayerCategory.PRIMERA,
        password: 'securepass123',
    };
    (0, vitest_1.it)('debe registrar un Player y persistirlo con role USER', async () => {
        // Arrange
        const repository = new InMemoryPlayerRepository_1.InMemoryPlayerRepository();
        const useCase = new RegisterPlayer_use_case_1.RegisterPlayer(repository, new FakePasswordHasher_1.FakePasswordHasher());
        // Act
        const result = await useCase.execute(baseProps);
        // Assert
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(true);
        if (!(0, result_1.isOk)(result))
            return;
        const player = result.value;
        (0, vitest_1.expect)(player.email.value).toBe('luis@example.com');
        (0, vitest_1.expect)(player.role).toBe('USER');
        (0, vitest_1.expect)(player.id).toBeDefined();
        const found = await repository.findByEmail(baseProps.email);
        (0, vitest_1.expect)(found).not.toBeNull();
        (0, vitest_1.expect)(found?.email.value).toBe('luis@example.com');
    });
    (0, vitest_1.it)('debe devolver Result.fail(EmailAlreadyInUseError) si el email ya está registrado', async () => {
        // Arrange
        const repository = new InMemoryPlayerRepository_1.InMemoryPlayerRepository();
        const useCase = new RegisterPlayer_use_case_1.RegisterPlayer(repository, new FakePasswordHasher_1.FakePasswordHasher());
        await useCase.execute(baseProps);
        // Act
        const result = await useCase.execute({ ...baseProps, name: 'Otro' });
        // Assert
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error).toBeInstanceOf(errors_1.EmailAlreadyInUseError);
    });
});
