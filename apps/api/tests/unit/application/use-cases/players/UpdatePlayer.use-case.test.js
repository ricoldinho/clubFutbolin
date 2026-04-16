"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const UpdatePlayer_use_case_1 = require("@/application/use-cases/players/UpdatePlayer.use-case");
const InMemoryPlayerRepository_1 = require("../../../../doubles/InMemoryPlayerRepository");
const FakePasswordHasher_1 = require("../../../../doubles/FakePasswordHasher");
const PlayerRole_1 = require("@/domain/players/PlayerRole");
const PlayerCategory_1 = require("@/domain/players/PlayerCategory");
const Email_value_object_1 = require("@/domain/players/value-objects/Email.value-object");
const PhoneNumber_value_object_1 = require("@/domain/players/value-objects/PhoneNumber.value-object");
const Birthdate_value_object_1 = require("@/domain/players/value-objects/Birthdate.value-object");
const PlayerId_value_object_1 = require("@/domain/players/value-objects/PlayerId.value-object");
const errors_1 = require("@/domain/shared/errors");
const errors_2 = require("@/domain/players/errors");
const RegisterPlayer_use_case_1 = require("@/application/use-cases/players/RegisterPlayer.use-case");
const result_1 = require("@/shared/result");
(0, vitest_1.describe)('UpdatePlayer', () => {
    (0, vitest_1.it)('actualiza los campos de un Player existente y devuelve Result.ok', async () => {
        // Arrange
        const repository = new InMemoryPlayerRepository_1.InMemoryPlayerRepository();
        const registerPlayer = new RegisterPlayer_use_case_1.RegisterPlayer(repository, new FakePasswordHasher_1.FakePasswordHasher());
        const updatePlayer = new UpdatePlayer_use_case_1.UpdatePlayer(repository);
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
        const result = await updatePlayer.execute({
            id: playerId,
            actor,
            name: 'Luis Actualizado',
            nickname: null,
        });
        // Assert
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(true);
        if (!(0, result_1.isOk)(result))
            return;
        (0, vitest_1.expect)(result.value.name).toBe('Luis Actualizado');
        (0, vitest_1.expect)(result.value.nickname).toBeNull();
    });
    (0, vitest_1.it)('devuelve Result.fail(NotFoundError) cuando el Player no existe', async () => {
        // Arrange
        const repository = new InMemoryPlayerRepository_1.InMemoryPlayerRepository();
        const updatePlayer = new UpdatePlayer_use_case_1.UpdatePlayer(repository);
        const fakeId = PlayerId_value_object_1.PlayerId.generate();
        const actor = { id: PlayerId_value_object_1.PlayerId.generate(), role: PlayerRole_1.PlayerRole.USER };
        // Act
        const result = await updatePlayer.execute({
            id: fakeId,
            actor,
            name: 'Nuevo nombre',
        });
        // Assert
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error).toBeInstanceOf(errors_1.NotFoundError);
    });
    (0, vitest_1.it)('devuelve Result.fail(EmailAlreadyInUseError) cuando el nuevo email ya está en uso', async () => {
        // Arrange
        const repository = new InMemoryPlayerRepository_1.InMemoryPlayerRepository();
        const registerPlayer = new RegisterPlayer_use_case_1.RegisterPlayer(repository, new FakePasswordHasher_1.FakePasswordHasher());
        const updatePlayer = new UpdatePlayer_use_case_1.UpdatePlayer(repository);
        const props1 = {
            name: 'Jugador 1',
            lastname: 'Uno',
            nickname: null,
            email: Email_value_object_1.Email.create('one@example.com'),
            phoneNumber: PhoneNumber_value_object_1.PhoneNumber.create('+34600000001'),
            birthdate: Birthdate_value_object_1.Birthdate.create('2000-01-01'),
            category: PlayerCategory_1.PlayerCategory.PRIMERA,
            password: 'password1',
        };
        const props2 = {
            name: 'Jugador 2',
            lastname: 'Dos',
            nickname: null,
            email: Email_value_object_1.Email.create('two@example.com'),
            phoneNumber: PhoneNumber_value_object_1.PhoneNumber.create('+34600000002'),
            birthdate: Birthdate_value_object_1.Birthdate.create('2001-02-02'),
            category: PlayerCategory_1.PlayerCategory.SEGUNDA,
            password: 'password2',
        };
        const r1 = await registerPlayer.execute(props1);
        const r2 = await registerPlayer.execute(props2);
        if (!(0, result_1.isOk)(r1) || !(0, result_1.isOk)(r2))
            throw new Error('Expected both registers to succeed');
        const player2Id = r2.value.id;
        const actor = { id: player2Id, role: PlayerRole_1.PlayerRole.USER };
        // Act
        const result = await updatePlayer.execute({
            id: player2Id,
            actor,
            email: props1.email,
        });
        // Assert
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error).toBeInstanceOf(errors_2.EmailAlreadyInUseError);
    });
    (0, vitest_1.it)('devuelve Result.fail(ForbiddenError) cuando un USER intenta actualizar otro jugador (no es self ni admin)', async () => {
        // Arrange
        const repository = new InMemoryPlayerRepository_1.InMemoryPlayerRepository();
        const registerPlayer = new RegisterPlayer_use_case_1.RegisterPlayer(repository, new FakePasswordHasher_1.FakePasswordHasher());
        const updatePlayer = new UpdatePlayer_use_case_1.UpdatePlayer(repository);
        const r1 = await registerPlayer.execute({
            name: 'Jugador 1',
            lastname: 'Uno',
            nickname: null,
            email: Email_value_object_1.Email.create('one@example.com'),
            phoneNumber: PhoneNumber_value_object_1.PhoneNumber.create('+34600000001'),
            birthdate: Birthdate_value_object_1.Birthdate.create('2000-01-01'),
            category: PlayerCategory_1.PlayerCategory.PRIMERA,
            password: 'password1',
        });
        const r2 = await registerPlayer.execute({
            name: 'Jugador 2',
            lastname: 'Dos',
            nickname: null,
            email: Email_value_object_1.Email.create('two@example.com'),
            phoneNumber: PhoneNumber_value_object_1.PhoneNumber.create('+34600000002'),
            birthdate: Birthdate_value_object_1.Birthdate.create('2001-02-02'),
            category: PlayerCategory_1.PlayerCategory.SEGUNDA,
            password: 'password2',
        });
        if (!(0, result_1.isOk)(r1) || !(0, result_1.isOk)(r2))
            throw new Error('Expected both registers to succeed');
        const player1Id = r1.value.id;
        const player2Id = r2.value.id;
        const actor = { id: player1Id, role: PlayerRole_1.PlayerRole.USER };
        // Act: player1 (USER) intenta cambiar el nombre de player2
        const result = await updatePlayer.execute({
            id: player2Id,
            actor,
            name: 'Nombre pirateado',
        });
        // Assert
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error).toBeInstanceOf(errors_1.ForbiddenError);
    });
    (0, vitest_1.it)('devuelve Result.fail(ForbiddenError) cuando un USER intenta asignar role ADMIN', async () => {
        // Arrange
        const repository = new InMemoryPlayerRepository_1.InMemoryPlayerRepository();
        const registerPlayer = new RegisterPlayer_use_case_1.RegisterPlayer(repository, new FakePasswordHasher_1.FakePasswordHasher());
        const updatePlayer = new UpdatePlayer_use_case_1.UpdatePlayer(repository);
        const props = {
            name: 'Luis',
            lastname: 'García',
            nickname: null,
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
        const result = await updatePlayer.execute({
            id: playerId,
            actor,
            role: PlayerRole_1.PlayerRole.ADMIN,
        });
        // Assert
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error).toBeInstanceOf(errors_1.ForbiddenError);
    });
});
