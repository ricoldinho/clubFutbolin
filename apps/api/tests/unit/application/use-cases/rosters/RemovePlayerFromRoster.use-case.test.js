"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const RemovePlayerFromRoster_use_case_1 = require("@/application/use-cases/rosters/RemovePlayerFromRoster.use-case");
const AddPlayerToRoster_use_case_1 = require("@/application/use-cases/rosters/AddPlayerToRoster.use-case");
const InMemoryRosterRepository_1 = require("../../../../doubles/InMemoryRosterRepository");
const InMemoryTeamRepository_1 = require("../../../../doubles/InMemoryTeamRepository");
const InMemorySeasonRepository_1 = require("../../../../doubles/InMemorySeasonRepository");
const InMemoryLeagueRepository_1 = require("../../../../doubles/InMemoryLeagueRepository");
const saveTeamInMemory_1 = require("../../../../doubles/saveTeamInMemory");
const CreateSeason_use_case_1 = require("@/application/use-cases/seasons/CreateSeason.use-case");
const RegisterTeamToSeason_use_case_1 = require("@/application/use-cases/rosters/RegisterTeamToSeason.use-case");
const League_entity_1 = require("@/domain/leagues/League.entity");
const LeagueId_value_object_1 = require("@/domain/leagues/LeagueId.value-object");
const TeamSeasonId_value_object_1 = require("@/domain/rosters/TeamSeasonId.value-object");
const PlayerId_value_object_1 = require("@/domain/players/value-objects/PlayerId.value-object");
const result_1 = require("@/shared/result");
(0, vitest_1.describe)('RemovePlayerFromRoster', () => {
    (0, vitest_1.it)('elimina un jugador de la plantilla', async () => {
        const leagueRepo = new InMemoryLeagueRepository_1.InMemoryLeagueRepository();
        const leagueId = LeagueId_value_object_1.LeagueId.generate();
        await leagueRepo.save(League_entity_1.League.create({ id: leagueId, name: 'Liga X', leagueCategory: 'PRIMERA' }));
        const teamRepo = new InMemoryTeamRepository_1.InMemoryTeamRepository();
        const seasonRepo = new InMemorySeasonRepository_1.InMemorySeasonRepository();
        const rosterRepo = new InMemoryRosterRepository_1.InMemoryRosterRepository();
        const team = await (0, saveTeamInMemory_1.saveTeamInMemory)(teamRepo, 'Equipo D');
        const seasonResult = await new CreateSeason_use_case_1.CreateSeason(seasonRepo, leagueRepo).execute({
            year: 2025,
            leagueId,
        });
        if (!(0, result_1.isOk)(seasonResult))
            throw new Error('Expected season create');
        const regResult = await new RegisterTeamToSeason_use_case_1.RegisterTeamToSeason(rosterRepo, teamRepo, seasonRepo).execute({ teamId: team.id, seasonId: seasonResult.value.id });
        if (!(0, result_1.isOk)(regResult))
            throw new Error('Expected register');
        const teamSeasonId = regResult.value.teamSeasonId;
        const playerId = PlayerId_value_object_1.PlayerId.generate();
        const addPlayer = new AddPlayerToRoster_use_case_1.AddPlayerToRoster(rosterRepo);
        const addResult = await addPlayer.execute({
            teamSeasonId,
            playerId,
            position: 'PORTERO',
        });
        if (!(0, result_1.isOk)(addResult))
            throw new Error('Expected add');
        const finalTsId = addResult.value.teamSeasonId;
        const removePlayer = new RemovePlayerFromRoster_use_case_1.RemovePlayerFromRoster(rosterRepo);
        const result = await removePlayer.execute({
            teamSeasonId: finalTsId,
            playerId,
        });
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(true);
        if (!(0, result_1.isOk)(result))
            return;
        (0, vitest_1.expect)(result.value.members).toHaveLength(0);
    });
    (0, vitest_1.it)('falla con NotFound cuando el roster no existe', async () => {
        const rosterRepo = new InMemoryRosterRepository_1.InMemoryRosterRepository();
        const teamSeasonId = TeamSeasonId_value_object_1.TeamSeasonId.generate();
        const playerId = PlayerId_value_object_1.PlayerId.generate();
        const removePlayer = new RemovePlayerFromRoster_use_case_1.RemovePlayerFromRoster(rosterRepo);
        const result = await removePlayer.execute({
            teamSeasonId,
            playerId,
        });
        (0, vitest_1.expect)(result.ok).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error.message).toContain('TeamSeason');
    });
    (0, vitest_1.it)('falla cuando el jugador no está en la plantilla', async () => {
        const leagueRepo = new InMemoryLeagueRepository_1.InMemoryLeagueRepository();
        const leagueId = LeagueId_value_object_1.LeagueId.generate();
        await leagueRepo.save(League_entity_1.League.create({ id: leagueId, name: 'Liga X', leagueCategory: 'PRIMERA' }));
        const teamRepo = new InMemoryTeamRepository_1.InMemoryTeamRepository();
        const seasonRepo = new InMemorySeasonRepository_1.InMemorySeasonRepository();
        const rosterRepo = new InMemoryRosterRepository_1.InMemoryRosterRepository();
        const team = await (0, saveTeamInMemory_1.saveTeamInMemory)(teamRepo, 'Equipo E');
        const seasonResult = await new CreateSeason_use_case_1.CreateSeason(seasonRepo, leagueRepo).execute({
            year: 2025,
            leagueId,
        });
        if (!(0, result_1.isOk)(seasonResult))
            throw new Error('Expected season create');
        const regResult = await new RegisterTeamToSeason_use_case_1.RegisterTeamToSeason(rosterRepo, teamRepo, seasonRepo).execute({ teamId: team.id, seasonId: seasonResult.value.id });
        if (!(0, result_1.isOk)(regResult))
            throw new Error('Expected register');
        const teamSeasonId = regResult.value.teamSeasonId;
        const playerInRoster = PlayerId_value_object_1.PlayerId.generate();
        const playerNotInRoster = PlayerId_value_object_1.PlayerId.generate();
        const addPlayer = new AddPlayerToRoster_use_case_1.AddPlayerToRoster(rosterRepo);
        const addResult = await addPlayer.execute({
            teamSeasonId,
            playerId: playerInRoster,
            position: 'PORTERO',
        });
        if (!(0, result_1.isOk)(addResult))
            throw new Error('Expected add');
        const removePlayer = new RemovePlayerFromRoster_use_case_1.RemovePlayerFromRoster(rosterRepo);
        const result = await removePlayer.execute({
            teamSeasonId: addResult.value.teamSeasonId,
            playerId: playerNotInRoster,
        });
        (0, vitest_1.expect)(result.ok).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error.message).toContain('no está en la plantilla');
    });
});
