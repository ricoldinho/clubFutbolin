"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const DeletePlayer_use_case_1 = require("@/application/use-cases/players/DeletePlayer.use-case");
const InMemoryPlayerRepository_1 = require("../../../../doubles/InMemoryPlayerRepository");
const FakePasswordHasher_1 = require("../../../../doubles/FakePasswordHasher");
const PlayerRole_1 = require("@/domain/players/PlayerRole");
const PlayerCategory_1 = require("@/domain/players/PlayerCategory");
const Email_value_object_1 = require("@/domain/players/value-objects/Email.value-object");
const PhoneNumber_value_object_1 = require("@/domain/players/value-objects/PhoneNumber.value-object");
const Birthdate_value_object_1 = require("@/domain/players/value-objects/Birthdate.value-object");
const PlayerId_value_object_1 = require("@/domain/players/value-objects/PlayerId.value-object");
const errors_1 = require("@/domain/shared/errors");
const RegisterPlayer_use_case_1 = require("@/application/use-cases/players/RegisterPlayer.use-case");
const result_1 = require("@/shared/result");
(0, vitest_1.describe)('DeletePlayer', () => {
    (0, vitest_1.it)('devuelve Result.ok y elimina el Player existente cuando el actor es el mismo', async () => {
        // Arrange
        const repository = new InMemoryPlayerRepository_1.InMemoryPlayerRepository();
        const registerPlayer = new RegisterPlayer_use_case_1.RegisterPlayer(repository, new FakePasswordHasher_1.FakePasswordHasher());
        const deletePlayer = new DeletePlayer_use_case_1.DeletePlayer(repository);
        const props = {
            name: 'Luis',
            lastname: 'García',
            nickname: 'Luigi',
            email: Email_value_object_1.Email.create('luis@example.com'),
            phoneNumber: PhoneNumber_value_object_1.PhoneNumber.create('+34612345678'),
            birthdate: Birthdate_value_object_1.Birthdate.create('2005-03-15'),
            category: PlayerCategory_1.PlayerCategory.PRIMERA,
            password: 'password123',
        };
        const registerResult = await registerPlayer.execute(props);
        if (!(0, result_1.isOk)(registerResult))
            throw new Error('Expected register to succeed');
        const playerId = registerResult.value.id;
        const actor = { id: playerId, role: PlayerRole_1.PlayerRole.USER };
        // Act
        const result = await deletePlayer.execute(playerId, actor);
        // Assert
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(true);
        const found = await repository.findById(playerId);
        (0, vitest_1.expect)(found).toBeNull();
    });
    (0, vitest_1.it)('devuelve Result.fail(NotFoundError) cuando el Player no existe', async () => {
        // Arrange
        const repository = new InMemoryPlayerRepository_1.InMemoryPlayerRepository();
        const deletePlayer = new DeletePlayer_use_case_1.DeletePlayer(repository);
        const id = PlayerId_value_object_1.PlayerId.generate();
        const actor = { id: PlayerId_value_object_1.PlayerId.generate(), role: PlayerRole_1.PlayerRole.USER };
        // Act
        const result = await deletePlayer.execute(id, actor);
        // Assert
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error).toBeInstanceOf(errors_1.NotFoundError);
        (0, vitest_1.expect)(result.error.message).toContain('Player');
    });
});
