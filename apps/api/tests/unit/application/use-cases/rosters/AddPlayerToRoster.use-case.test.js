"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const AddPlayerToRoster_use_case_1 = require("@/application/use-cases/rosters/AddPlayerToRoster.use-case");
const InMemoryRosterRepository_1 = require("../../../../doubles/InMemoryRosterRepository");
const InMemoryTeamRepository_1 = require("../../../../doubles/InMemoryTeamRepository");
const InMemorySeasonRepository_1 = require("../../../../doubles/InMemorySeasonRepository");
const InMemoryLeagueRepository_1 = require("../../../../doubles/InMemoryLeagueRepository");
const CreateSeason_use_case_1 = require("@/application/use-cases/seasons/CreateSeason.use-case");
const saveTeamInMemory_1 = require("../../../../doubles/saveTeamInMemory");
const RegisterTeamToSeason_use_case_1 = require("@/application/use-cases/rosters/RegisterTeamToSeason.use-case");
const League_entity_1 = require("@/domain/leagues/League.entity");
const LeagueId_value_object_1 = require("@/domain/leagues/LeagueId.value-object");
const TeamSeasonId_value_object_1 = require("@/domain/rosters/TeamSeasonId.value-object");
const PlayerId_value_object_1 = require("@/domain/players/value-objects/PlayerId.value-object");
const result_1 = require("@/shared/result");
(0, vitest_1.describe)('AddPlayerToRoster', () => {
    (0, vitest_1.it)('añade un jugador a la plantilla', async () => {
        const leagueRepo = new InMemoryLeagueRepository_1.InMemoryLeagueRepository();
        const leagueId = LeagueId_value_object_1.LeagueId.generate();
        await leagueRepo.save(League_entity_1.League.create({ id: leagueId, name: 'Liga X', leagueCategory: 'PRIMERA' }));
        const teamRepo = new InMemoryTeamRepository_1.InMemoryTeamRepository();
        const seasonRepo = new InMemorySeasonRepository_1.InMemorySeasonRepository();
        const rosterRepo = new InMemoryRosterRepository_1.InMemoryRosterRepository();
        const team = await (0, saveTeamInMemory_1.saveTeamInMemory)(teamRepo, 'Equipo A');
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
        const result = await addPlayer.execute({
            teamSeasonId,
            playerId,
            position: 'PORTERO',
        });
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(true);
        if (!(0, result_1.isOk)(result))
            return;
        (0, vitest_1.expect)(result.value.members).toHaveLength(1);
        (0, vitest_1.expect)(result.value.members[0].playerId.equals(playerId)).toBe(true);
    });
    (0, vitest_1.it)('falla con NotFound cuando el roster no existe', async () => {
        const rosterRepo = new InMemoryRosterRepository_1.InMemoryRosterRepository();
        const teamSeasonId = TeamSeasonId_value_object_1.TeamSeasonId.generate();
        const playerId = PlayerId_value_object_1.PlayerId.generate();
        const addPlayer = new AddPlayerToRoster_use_case_1.AddPlayerToRoster(rosterRepo);
        const result = await addPlayer.execute({
            teamSeasonId,
            playerId,
            position: 'DELANTERO',
        });
        (0, vitest_1.expect)(result.ok).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error.message).toContain('TeamSeason');
    });
    (0, vitest_1.it)('falla cuando la plantilla ya tiene 4 jugadores', async () => {
        const leagueRepo = new InMemoryLeagueRepository_1.InMemoryLeagueRepository();
        const leagueId = LeagueId_value_object_1.LeagueId.generate();
        await leagueRepo.save(League_entity_1.League.create({ id: leagueId, name: 'Liga X', leagueCategory: 'PRIMERA' }));
        const teamRepo = new InMemoryTeamRepository_1.InMemoryTeamRepository();
        const seasonRepo = new InMemorySeasonRepository_1.InMemorySeasonRepository();
        const rosterRepo = new InMemoryRosterRepository_1.InMemoryRosterRepository();
        const team = await (0, saveTeamInMemory_1.saveTeamInMemory)(teamRepo, 'Equipo B');
        const seasonResult = await new CreateSeason_use_case_1.CreateSeason(seasonRepo, leagueRepo).execute({
            year: 2025,
            leagueId,
        });
        if (!(0, result_1.isOk)(seasonResult))
            throw new Error('Expected season create');
        const regResult = await new RegisterTeamToSeason_use_case_1.RegisterTeamToSeason(rosterRepo, teamRepo, seasonRepo).execute({ teamId: team.id, seasonId: seasonResult.value.id });
        if (!(0, result_1.isOk)(regResult))
            throw new Error('Expected register');
        const addPlayer = new AddPlayerToRoster_use_case_1.AddPlayerToRoster(rosterRepo);
        let roster = regResult.value;
        for (let i = 0; i < 4; i++) {
            const r = await addPlayer.execute({
                teamSeasonId: roster.teamSeasonId,
                playerId: PlayerId_value_object_1.PlayerId.generate(),
                position: i === 0 ? 'PORTERO' : 'DELANTERO',
            });
            if (!(0, result_1.isOk)(r))
                throw new Error('Expected add success');
            roster = r.value;
        }
        const fifth = await addPlayer.execute({
            teamSeasonId: roster.teamSeasonId,
            playerId: PlayerId_value_object_1.PlayerId.generate(),
            position: 'DELANTERO',
        });
        (0, vitest_1.expect)(fifth.ok).toBe(false);
        if (fifth.ok)
            return;
        (0, vitest_1.expect)(fifth.error.message).toContain('4 jugadores');
    });
    (0, vitest_1.it)('falla cuando el jugador ya está en la plantilla', async () => {
        const leagueRepo = new InMemoryLeagueRepository_1.InMemoryLeagueRepository();
        const leagueId = LeagueId_value_object_1.LeagueId.generate();
        await leagueRepo.save(League_entity_1.League.create({ id: leagueId, name: 'Liga X', leagueCategory: 'PRIMERA' }));
        const teamRepo = new InMemoryTeamRepository_1.InMemoryTeamRepository();
        const seasonRepo = new InMemorySeasonRepository_1.InMemorySeasonRepository();
        const rosterRepo = new InMemoryRosterRepository_1.InMemoryRosterRepository();
        const team = await (0, saveTeamInMemory_1.saveTeamInMemory)(teamRepo, 'Equipo C');
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
        await addPlayer.execute({
            teamSeasonId,
            playerId,
            position: 'PORTERO',
        });
        const duplicate = await addPlayer.execute({
            teamSeasonId,
            playerId,
            position: 'DELANTERO',
        });
        (0, vitest_1.expect)(duplicate.ok).toBe(false);
        if (duplicate.ok)
            return;
        (0, vitest_1.expect)(duplicate.error.message).toContain('ya está en la plantilla');
    });
});
