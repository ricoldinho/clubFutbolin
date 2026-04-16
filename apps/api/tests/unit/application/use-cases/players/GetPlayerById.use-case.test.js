"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const GetPlayerById_use_case_1 = require("@/application/use-cases/players/GetPlayerById.use-case");
const InMemoryPlayerRepository_1 = require("../../../../doubles/InMemoryPlayerRepository");
const FakePasswordHasher_1 = require("../../../../doubles/FakePasswordHasher");
const PlayerRole_1 = require("@/domain/players/PlayerRole");
const PlayerCategory_1 = require("@/domain/players/PlayerCategory");
const Email_value_object_1 = require("@/domain/players/value-objects/Email.value-object");
const PhoneNumber_value_object_1 = require("@/domain/players/value-objects/PhoneNumber.value-object");
const Birthdate_value_object_1 = require("@/domain/players/value-objects/Birthdate.value-object");
const PlayerId_value_object_1 = require("@/domain/players/value-objects/PlayerId.value-object");
const errors_1 = require("@/domain/shared/errors");
const result_1 = require("@/shared/result");
const RegisterPlayer_use_case_1 = require("@/application/use-cases/players/RegisterPlayer.use-case");
(0, vitest_1.describe)('GetPlayerById', () => {
    (0, vitest_1.it)('devuelve Result.ok(Player) cuando el Player existe y el actor es el mismo', async () => {
        // Arrange
        const repository = new InMemoryPlayerRepository_1.InMemoryPlayerRepository();
        const registerPlayer = new RegisterPlayer_use_case_1.RegisterPlayer(repository, new FakePasswordHasher_1.FakePasswordHasher());
        const getPlayerById = new GetPlayerById_use_case_1.GetPlayerById(repository);
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
        const result = await getPlayerById.execute(playerId, actor);
        // Assert
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(true);
        if (!(0, result_1.isOk)(result))
            return;
        (0, vitest_1.expect)(result.value.id?.value).toBe(playerId.value);
        (0, vitest_1.expect)(result.value.email.value).toBe('luis@example.com');
    });
    (0, vitest_1.it)('devuelve Result.fail(NotFoundError) cuando el Player no existe', async () => {
        // Arrange
        const repository = new InMemoryPlayerRepository_1.InMemoryPlayerRepository();
        const getPlayerById = new GetPlayerById_use_case_1.GetPlayerById(repository);
        const id = PlayerId_value_object_1.PlayerId.generate();
        const actor = { id: PlayerId_value_object_1.PlayerId.generate(), role: PlayerRole_1.PlayerRole.USER };
        // Act
        const result = await getPlayerById.execute(id, actor);
        // Assert
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error).toBeInstanceOf(errors_1.NotFoundError);
        (0, vitest_1.expect)(result.error.message).toContain('Player');
    });
});
