"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ListPlayers_use_case_1 = require("@/application/use-cases/players/ListPlayers.use-case");
const RegisterPlayer_use_case_1 = require("@/application/use-cases/players/RegisterPlayer.use-case");
const InMemoryPlayerRepository_1 = require("../../../../doubles/InMemoryPlayerRepository");
const FakePasswordHasher_1 = require("../../../../doubles/FakePasswordHasher");
const PlayerCategory_1 = require("@/domain/players/PlayerCategory");
const Email_value_object_1 = require("@/domain/players/value-objects/Email.value-object");
const PhoneNumber_value_object_1 = require("@/domain/players/value-objects/PhoneNumber.value-object");
const Birthdate_value_object_1 = require("@/domain/players/value-objects/Birthdate.value-object");
const result_1 = require("@/shared/result");
(0, vitest_1.describe)('ListPlayers', () => {
    (0, vitest_1.it)('devuelve Result.ok([]) cuando no hay jugadores', async () => {
        // Arrange
        const repository = new InMemoryPlayerRepository_1.InMemoryPlayerRepository();
        const listPlayers = new ListPlayers_use_case_1.ListPlayers(repository);
        // Act
        const result = await listPlayers.execute({ pagination: { page: 1, limit: 20 } });
        // Assert
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(true);
        if (!(0, result_1.isOk)(result))
            return;
        (0, vitest_1.expect)(result.value.data).toEqual([]);
        (0, vitest_1.expect)(result.value.data).toHaveLength(0);
        (0, vitest_1.expect)(result.value.total).toBe(0);
    });
    (0, vitest_1.it)('devuelve Result.ok(players) con los jugadores guardados', async () => {
        // Arrange
        const repository = new InMemoryPlayerRepository_1.InMemoryPlayerRepository();
        const registerPlayer = new RegisterPlayer_use_case_1.RegisterPlayer(repository, new FakePasswordHasher_1.FakePasswordHasher());
        const listPlayers = new ListPlayers_use_case_1.ListPlayers(repository);
        const props1 = {
            name: 'Ana',
            lastname: 'López',
            nickname: null,
            email: Email_value_object_1.Email.create('ana@example.com'),
            phoneNumber: PhoneNumber_value_object_1.PhoneNumber.create('612345678'),
            birthdate: Birthdate_value_object_1.Birthdate.create('1998-01-10'),
            category: PlayerCategory_1.PlayerCategory.TERCERA,
            password: 'password1',
        };
        const props2 = {
            name: 'Bruno',
            lastname: 'Martín',
            nickname: 'Bru',
            email: Email_value_object_1.Email.create('bruno@example.com'),
            phoneNumber: PhoneNumber_value_object_1.PhoneNumber.create('698765432'),
            birthdate: Birthdate_value_object_1.Birthdate.create('2000-05-20'),
            category: PlayerCategory_1.PlayerCategory.SEGUNDA,
            password: 'password2',
        };
        await registerPlayer.execute(props1);
        await registerPlayer.execute(props2);
        // Act
        const result = await listPlayers.execute({ pagination: { page: 1, limit: 20 } });
        // Assert
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(true);
        if (!(0, result_1.isOk)(result))
            return;
        (0, vitest_1.expect)(result.value.data).toHaveLength(2);
        (0, vitest_1.expect)(result.value.total).toBe(2);
        const emails = result.value.data.map((p) => p.email.value).sort();
        (0, vitest_1.expect)(emails).toEqual(['ana@example.com', 'bruno@example.com']);
        (0, vitest_1.expect)(result.value.data.map((p) => p.name).sort()).toEqual(['Ana', 'Bruno']);
    });
    (0, vitest_1.it)('con paginación devuelve solo la ventana solicitada', async () => {
        const repository = new InMemoryPlayerRepository_1.InMemoryPlayerRepository();
        const registerPlayer = new RegisterPlayer_use_case_1.RegisterPlayer(repository, new FakePasswordHasher_1.FakePasswordHasher());
        const listPlayers = new ListPlayers_use_case_1.ListPlayers(repository);
        for (let i = 0; i < 3; i += 1) {
            await registerPlayer.execute({
                name: `U${i}`,
                lastname: 'Test',
                nickname: null,
                email: Email_value_object_1.Email.create(`u${i}@example.com`),
                phoneNumber: PhoneNumber_value_object_1.PhoneNumber.create(`60000000${i}`),
                birthdate: Birthdate_value_object_1.Birthdate.create('1998-01-10'),
                category: PlayerCategory_1.PlayerCategory.TERCERA,
                password: 'password1',
            });
        }
        const page1 = await listPlayers.execute({ pagination: { page: 1, limit: 2 } });
        (0, vitest_1.expect)((0, result_1.isOk)(page1)).toBe(true);
        if (!(0, result_1.isOk)(page1))
            return;
        (0, vitest_1.expect)(page1.value.data).toHaveLength(2);
        (0, vitest_1.expect)(page1.value.total).toBe(3);
        const page2 = await listPlayers.execute({ pagination: { page: 2, limit: 2 } });
        (0, vitest_1.expect)((0, result_1.isOk)(page2)).toBe(true);
        if (!(0, result_1.isOk)(page2))
            return;
        (0, vitest_1.expect)(page2.value.data).toHaveLength(1);
    });
    (0, vitest_1.it)('con searchQuery filtra por nombre, apellidos o alias', async () => {
        const repository = new InMemoryPlayerRepository_1.InMemoryPlayerRepository();
        const registerPlayer = new RegisterPlayer_use_case_1.RegisterPlayer(repository, new FakePasswordHasher_1.FakePasswordHasher());
        const listPlayers = new ListPlayers_use_case_1.ListPlayers(repository);
        await registerPlayer.execute({
            name: 'Ana',
            lastname: 'López',
            nickname: 'anita',
            email: Email_value_object_1.Email.create('ana@example.com'),
            phoneNumber: PhoneNumber_value_object_1.PhoneNumber.create('612345678'),
            birthdate: Birthdate_value_object_1.Birthdate.create('1998-01-10'),
            category: PlayerCategory_1.PlayerCategory.TERCERA,
            password: 'password1',
        });
        await registerPlayer.execute({
            name: 'Bruno',
            lastname: 'Martín',
            nickname: 'Bru',
            email: Email_value_object_1.Email.create('bruno@example.com'),
            phoneNumber: PhoneNumber_value_object_1.PhoneNumber.create('698765432'),
            birthdate: Birthdate_value_object_1.Birthdate.create('2000-05-20'),
            category: PlayerCategory_1.PlayerCategory.SEGUNDA,
            password: 'password2',
        });
        const byNick = await listPlayers.execute({
            pagination: { page: 1, limit: 20 },
            searchQuery: 'bru',
        });
        (0, vitest_1.expect)((0, result_1.isOk)(byNick)).toBe(true);
        if (!(0, result_1.isOk)(byNick))
            return;
        (0, vitest_1.expect)(byNick.value.total).toBe(1);
        (0, vitest_1.expect)(byNick.value.data[0].name).toBe('Bruno');
        const byLastname = await listPlayers.execute({
            pagination: { page: 1, limit: 20 },
            searchQuery: 'López',
        });
        (0, vitest_1.expect)((0, result_1.isOk)(byLastname)).toBe(true);
        if (!(0, result_1.isOk)(byLastname))
            return;
        (0, vitest_1.expect)(byLastname.value.total).toBe(1);
        (0, vitest_1.expect)(byLastname.value.data[0].name).toBe('Ana');
    });
});
