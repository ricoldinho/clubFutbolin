"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const InMemoryTeamRepository_1 = require("../../../../doubles/InMemoryTeamRepository");
const InMemorySeasonRepository_1 = require("../../../../doubles/InMemorySeasonRepository");
const InMemoryRosterRepository_1 = require("../../../../doubles/InMemoryRosterRepository");
const InMemoryPlayerRepository_1 = require("../../../../doubles/InMemoryPlayerRepository");
const buildCreateTeamUseCase_1 = require("../../../../doubles/buildCreateTeamUseCase");
const errors_1 = require("@/domain/shared/errors");
const result_1 = require("@/shared/result");
const TeamId_value_object_1 = require("@/domain/teams/TeamId.value-object");
const Season_entity_1 = require("@/domain/seasons/Season.entity");
const SeasonId_value_object_1 = require("@/domain/seasons/SeasonId.value-object");
const LeagueId_value_object_1 = require("@/domain/leagues/LeagueId.value-object");
const Player_entity_1 = require("@/domain/players/Player.entity");
const PlayerCategory_1 = require("@/domain/players/PlayerCategory");
const PlayerRole_1 = require("@/domain/players/PlayerRole");
const Email_value_object_1 = require("@/domain/players/value-objects/Email.value-object");
const PhoneNumber_value_object_1 = require("@/domain/players/value-objects/PhoneNumber.value-object");
const Birthdate_value_object_1 = require("@/domain/players/value-objects/Birthdate.value-object");
const PlayerId_value_object_1 = require("@/domain/players/value-objects/PlayerId.value-object");
const P1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const P2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
async function seedSeasonAndPlayers(seasonRepo, playerRepo) {
    const leagueId = LeagueId_value_object_1.LeagueId.generate();
    await seasonRepo.save(Season_entity_1.Season.create({
        id: SeasonId_value_object_1.SeasonId.generate(),
        year: 2026,
        leagueId,
    }));
    await playerRepo.save(Player_entity_1.Player.create({
        id: PlayerId_value_object_1.PlayerId.fromString(P1),
        name: 'A',
        lastname: 'Uno',
        nickname: null,
        email: Email_value_object_1.Email.create('ct-p1@test.local'),
        phoneNumber: PhoneNumber_value_object_1.PhoneNumber.create('600000011'),
        birthdate: Birthdate_value_object_1.Birthdate.create('2000-01-01'),
        category: PlayerCategory_1.PlayerCategory.PRIMERA,
        role: PlayerRole_1.PlayerRole.USER,
    }), 'h');
    await playerRepo.save(Player_entity_1.Player.create({
        id: PlayerId_value_object_1.PlayerId.fromString(P2),
        name: 'B',
        lastname: 'Dos',
        nickname: null,
        email: Email_value_object_1.Email.create('ct-p2@test.local'),
        phoneNumber: PhoneNumber_value_object_1.PhoneNumber.create('600000012'),
        birthdate: Birthdate_value_object_1.Birthdate.create('2001-01-01'),
        category: PlayerCategory_1.PlayerCategory.PRIMERA,
        role: PlayerRole_1.PlayerRole.USER,
    }), 'h');
}
(0, vitest_1.describe)('CreateTeam', () => {
    (0, vitest_1.it)('crea un equipo, lo inscribe en la última temporada y añade la plantilla inicial', async () => {
        const teamRepo = new InMemoryTeamRepository_1.InMemoryTeamRepository();
        const seasonRepo = new InMemorySeasonRepository_1.InMemorySeasonRepository();
        const rosterRepo = new InMemoryRosterRepository_1.InMemoryRosterRepository();
        const playerRepo = new InMemoryPlayerRepository_1.InMemoryPlayerRepository();
        await seedSeasonAndPlayers(seasonRepo, playerRepo);
        const createTeam = (0, buildCreateTeamUseCase_1.buildCreateTeamUseCase)({
            teamRepository: teamRepo,
            seasonRepository: seasonRepo,
            rosterRepository: rosterRepo,
            playerRepository: playerRepo,
        });
        const result = await createTeam.execute({
            name: 'Equipo A',
            playerIds: [P1, P2],
        });
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(true);
        if (!(0, result_1.isOk)(result))
            return;
        (0, vitest_1.expect)(result.value.name).toBe('Equipo A');
        (0, vitest_1.expect)(result.value.id).toBeInstanceOf(TeamId_value_object_1.TeamId);
        const season = (await seasonRepo.findLatestByYear());
        const roster = await rosterRepo.findTeamSeasonByTeamAndSeason(result.value.id, season.id);
        (0, vitest_1.expect)(roster).not.toBeNull();
        (0, vitest_1.expect)(roster.members).toHaveLength(2);
    });
    (0, vitest_1.it)('devuelve Result.fail(AlreadyExistsError) cuando ya existe un equipo con el mismo nombre', async () => {
        const teamRepo = new InMemoryTeamRepository_1.InMemoryTeamRepository();
        const seasonRepo = new InMemorySeasonRepository_1.InMemorySeasonRepository();
        const rosterRepo = new InMemoryRosterRepository_1.InMemoryRosterRepository();
        const playerRepo = new InMemoryPlayerRepository_1.InMemoryPlayerRepository();
        await seedSeasonAndPlayers(seasonRepo, playerRepo);
        const createTeam = (0, buildCreateTeamUseCase_1.buildCreateTeamUseCase)({
            teamRepository: teamRepo,
            seasonRepository: seasonRepo,
            rosterRepository: rosterRepo,
            playerRepository: playerRepo,
        });
        await createTeam.execute({ name: 'Equipo A', playerIds: [P1, P2] });
        const result = await createTeam.execute({ name: 'Equipo A', playerIds: [P1, P2] });
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error).toBeInstanceOf(errors_1.AlreadyExistsError);
    });
    (0, vitest_1.it)('falla si hay menos de 2 jugadores distintos', async () => {
        const teamRepo = new InMemoryTeamRepository_1.InMemoryTeamRepository();
        const seasonRepo = new InMemorySeasonRepository_1.InMemorySeasonRepository();
        const rosterRepo = new InMemoryRosterRepository_1.InMemoryRosterRepository();
        const playerRepo = new InMemoryPlayerRepository_1.InMemoryPlayerRepository();
        await seedSeasonAndPlayers(seasonRepo, playerRepo);
        const createTeam = (0, buildCreateTeamUseCase_1.buildCreateTeamUseCase)({
            teamRepository: teamRepo,
            seasonRepository: seasonRepo,
            rosterRepository: rosterRepo,
            playerRepository: playerRepo,
        });
        const result = await createTeam.execute({ name: 'X', playerIds: [P1] });
        (0, vitest_1.expect)(result.ok).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error.message).toContain('2');
    });
    (0, vitest_1.it)('falla con NotFound si un jugador no existe', async () => {
        const teamRepo = new InMemoryTeamRepository_1.InMemoryTeamRepository();
        const seasonRepo = new InMemorySeasonRepository_1.InMemorySeasonRepository();
        const rosterRepo = new InMemoryRosterRepository_1.InMemoryRosterRepository();
        const playerRepo = new InMemoryPlayerRepository_1.InMemoryPlayerRepository();
        await seedSeasonAndPlayers(seasonRepo, playerRepo);
        const createTeam = (0, buildCreateTeamUseCase_1.buildCreateTeamUseCase)({
            teamRepository: teamRepo,
            seasonRepository: seasonRepo,
            rosterRepository: rosterRepo,
            playerRepository: playerRepo,
        });
        const missing = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
        const result = await createTeam.execute({ name: 'Y', playerIds: [P1, missing] });
        (0, vitest_1.expect)(result.ok).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error).toBeInstanceOf(errors_1.NotFoundError);
    });
    (0, vitest_1.it)('falla si no hay ninguna temporada', async () => {
        const teamRepo = new InMemoryTeamRepository_1.InMemoryTeamRepository();
        const seasonRepo = new InMemorySeasonRepository_1.InMemorySeasonRepository();
        const rosterRepo = new InMemoryRosterRepository_1.InMemoryRosterRepository();
        const playerRepo = new InMemoryPlayerRepository_1.InMemoryPlayerRepository();
        await playerRepo.save(Player_entity_1.Player.create({
            id: PlayerId_value_object_1.PlayerId.fromString(P1),
            name: 'A',
            lastname: 'Uno',
            nickname: null,
            email: Email_value_object_1.Email.create('ct-p1b@test.local'),
            phoneNumber: PhoneNumber_value_object_1.PhoneNumber.create('600000013'),
            birthdate: Birthdate_value_object_1.Birthdate.create('2000-01-01'),
            category: PlayerCategory_1.PlayerCategory.PRIMERA,
            role: PlayerRole_1.PlayerRole.USER,
        }), 'h');
        await playerRepo.save(Player_entity_1.Player.create({
            id: PlayerId_value_object_1.PlayerId.fromString(P2),
            name: 'B',
            lastname: 'Dos',
            nickname: null,
            email: Email_value_object_1.Email.create('ct-p2b@test.local'),
            phoneNumber: PhoneNumber_value_object_1.PhoneNumber.create('600000014'),
            birthdate: Birthdate_value_object_1.Birthdate.create('2001-01-01'),
            category: PlayerCategory_1.PlayerCategory.PRIMERA,
            role: PlayerRole_1.PlayerRole.USER,
        }), 'h');
        const createTeam = (0, buildCreateTeamUseCase_1.buildCreateTeamUseCase)({
            teamRepository: teamRepo,
            seasonRepository: seasonRepo,
            rosterRepository: rosterRepo,
            playerRepository: playerRepo,
        });
        const result = await createTeam.execute({ name: 'Z', playerIds: [P1, P2] });
        (0, vitest_1.expect)(result.ok).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error.message).toContain('temporadas');
    });
});
