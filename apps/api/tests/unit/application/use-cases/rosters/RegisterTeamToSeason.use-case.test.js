"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const RegisterTeamToSeason_use_case_1 = require("@/application/use-cases/rosters/RegisterTeamToSeason.use-case");
const InMemoryRosterRepository_1 = require("../../../../doubles/InMemoryRosterRepository");
const InMemoryTeamRepository_1 = require("../../../../doubles/InMemoryTeamRepository");
const InMemorySeasonRepository_1 = require("../../../../doubles/InMemorySeasonRepository");
const InMemoryLeagueRepository_1 = require("../../../../doubles/InMemoryLeagueRepository");
const CreateSeason_use_case_1 = require("@/application/use-cases/seasons/CreateSeason.use-case");
const saveTeamInMemory_1 = require("../../../../doubles/saveTeamInMemory");
const League_entity_1 = require("@/domain/leagues/League.entity");
const LeagueId_value_object_1 = require("@/domain/leagues/LeagueId.value-object");
const TeamId_value_object_1 = require("@/domain/teams/TeamId.value-object");
const SeasonId_value_object_1 = require("@/domain/seasons/SeasonId.value-object");
const result_1 = require("@/shared/result");
(0, vitest_1.describe)('RegisterTeamToSeason', () => {
    (0, vitest_1.it)('falla con NotFound cuando el equipo no existe', async () => {
        const leagueRepo = new InMemoryLeagueRepository_1.InMemoryLeagueRepository();
        const leagueId = LeagueId_value_object_1.LeagueId.generate();
        await leagueRepo.save(League_entity_1.League.create({ id: leagueId, name: 'Liga X', leagueCategory: 'PRIMERA' }));
        const seasonRepo = new InMemorySeasonRepository_1.InMemorySeasonRepository();
        const rosterRepo = new InMemoryRosterRepository_1.InMemoryRosterRepository();
        const teamRepo = new InMemoryTeamRepository_1.InMemoryTeamRepository();
        const createSeason = new CreateSeason_use_case_1.CreateSeason(seasonRepo, leagueRepo);
        const seasonResult = await createSeason.execute({ year: 2025, leagueId });
        if (!(0, result_1.isOk)(seasonResult))
            throw new Error('Expected season create');
        const teamId = TeamId_value_object_1.TeamId.generate();
        const register = new RegisterTeamToSeason_use_case_1.RegisterTeamToSeason(rosterRepo, teamRepo, seasonRepo);
        const result = await register.execute({
            teamId,
            seasonId: seasonResult.value.id,
        });
        (0, vitest_1.expect)(result.ok).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error.message).toContain('Team');
    });
    (0, vitest_1.it)('falla con NotFound cuando la temporada no existe', async () => {
        const teamRepo = new InMemoryTeamRepository_1.InMemoryTeamRepository();
        const seasonRepo = new InMemorySeasonRepository_1.InMemorySeasonRepository();
        const rosterRepo = new InMemoryRosterRepository_1.InMemoryRosterRepository();
        const team = await (0, saveTeamInMemory_1.saveTeamInMemory)(teamRepo, 'Equipo X');
        const seasonId = SeasonId_value_object_1.SeasonId.generate();
        const register = new RegisterTeamToSeason_use_case_1.RegisterTeamToSeason(rosterRepo, teamRepo, seasonRepo);
        const result = await register.execute({
            teamId: team.id,
            seasonId,
        });
        (0, vitest_1.expect)(result.ok).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error.message).toContain('Season');
    });
    (0, vitest_1.it)('falla con AlreadyExists cuando el equipo ya está inscrito', async () => {
        const leagueRepo = new InMemoryLeagueRepository_1.InMemoryLeagueRepository();
        const leagueId = LeagueId_value_object_1.LeagueId.generate();
        await leagueRepo.save(League_entity_1.League.create({ id: leagueId, name: 'Liga X', leagueCategory: 'PRIMERA' }));
        const teamRepo = new InMemoryTeamRepository_1.InMemoryTeamRepository();
        const seasonRepo = new InMemorySeasonRepository_1.InMemorySeasonRepository();
        const rosterRepo = new InMemoryRosterRepository_1.InMemoryRosterRepository();
        const createSeason = new CreateSeason_use_case_1.CreateSeason(seasonRepo, leagueRepo);
        const team = await (0, saveTeamInMemory_1.saveTeamInMemory)(teamRepo, 'Equipo Y');
        const seasonResult = await createSeason.execute({ year: 2025, leagueId });
        if (!(0, result_1.isOk)(seasonResult))
            throw new Error('Expected season create');
        const register = new RegisterTeamToSeason_use_case_1.RegisterTeamToSeason(rosterRepo, teamRepo, seasonRepo);
        await register.execute({
            teamId: team.id,
            seasonId: seasonResult.value.id,
        });
        const duplicate = await register.execute({
            teamId: team.id,
            seasonId: seasonResult.value.id,
        });
        (0, vitest_1.expect)(duplicate.ok).toBe(false);
        if (duplicate.ok)
            return;
        (0, vitest_1.expect)(duplicate.error.message).toContain('ya inscrito');
    });
    (0, vitest_1.it)('inscribe un equipo en una temporada', async () => {
        const leagueRepo = new InMemoryLeagueRepository_1.InMemoryLeagueRepository();
        const leagueId = LeagueId_value_object_1.LeagueId.generate();
        await leagueRepo.save(League_entity_1.League.create({ id: leagueId, name: 'Liga X', leagueCategory: 'PRIMERA' }));
        const teamRepo = new InMemoryTeamRepository_1.InMemoryTeamRepository();
        const seasonRepo = new InMemorySeasonRepository_1.InMemorySeasonRepository();
        const rosterRepo = new InMemoryRosterRepository_1.InMemoryRosterRepository();
        const createSeason = new CreateSeason_use_case_1.CreateSeason(seasonRepo, leagueRepo);
        const team = await (0, saveTeamInMemory_1.saveTeamInMemory)(teamRepo, 'Equipo A');
        const seasonResult = await createSeason.execute({ year: 2025, leagueId });
        if (!(0, result_1.isOk)(seasonResult))
            throw new Error('Expected season create to succeed');
        const register = new RegisterTeamToSeason_use_case_1.RegisterTeamToSeason(rosterRepo, teamRepo, seasonRepo);
        const result = await register.execute({
            teamId: team.id,
            seasonId: seasonResult.value.id,
        });
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(true);
        if (!(0, result_1.isOk)(result))
            return;
        (0, vitest_1.expect)(result.value.teamId.value).toBe(team.id.value);
        (0, vitest_1.expect)(result.value.members).toHaveLength(0);
    });
});
