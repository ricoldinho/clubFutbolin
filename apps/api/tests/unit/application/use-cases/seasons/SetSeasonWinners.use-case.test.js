"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const SetSeasonWinners_use_case_1 = require("@/application/use-cases/seasons/SetSeasonWinners.use-case");
const InMemorySeasonRepository_1 = require("../../../../doubles/InMemorySeasonRepository");
const InMemoryLeagueRepository_1 = require("../../../../doubles/InMemoryLeagueRepository");
const InMemoryTeamRepository_1 = require("../../../../doubles/InMemoryTeamRepository");
const CreateSeason_use_case_1 = require("@/application/use-cases/seasons/CreateSeason.use-case");
const saveTeamInMemory_1 = require("../../../../doubles/saveTeamInMemory");
const League_entity_1 = require("@/domain/leagues/League.entity");
const LeagueId_value_object_1 = require("@/domain/leagues/LeagueId.value-object");
const SeasonId_value_object_1 = require("@/domain/seasons/SeasonId.value-object");
const TeamId_value_object_1 = require("@/domain/teams/TeamId.value-object");
const result_1 = require("@/shared/result");
(0, vitest_1.describe)('SetSeasonWinners', () => {
    (0, vitest_1.it)('asigna campeón y subcampeón a una temporada', async () => {
        const leagueRepo = new InMemoryLeagueRepository_1.InMemoryLeagueRepository();
        const leagueId = LeagueId_value_object_1.LeagueId.generate();
        await leagueRepo.save(League_entity_1.League.create({ id: leagueId, name: 'Liga X', leagueCategory: 'PRIMERA' }));
        const seasonRepo = new InMemorySeasonRepository_1.InMemorySeasonRepository();
        const teamRepo = new InMemoryTeamRepository_1.InMemoryTeamRepository();
        const createSeason = new CreateSeason_use_case_1.CreateSeason(seasonRepo, leagueRepo);
        const createResult = await createSeason.execute({ year: 2025, leagueId });
        if (!(0, result_1.isOk)(createResult))
            throw new Error('Expected season create');
        const t1 = await (0, saveTeamInMemory_1.saveTeamInMemory)(teamRepo, 'Campeón');
        const t2 = await (0, saveTeamInMemory_1.saveTeamInMemory)(teamRepo, 'Subcampeón');
        const setWinners = new SetSeasonWinners_use_case_1.SetSeasonWinners(seasonRepo, teamRepo);
        const result = await setWinners.execute({
            seasonId: createResult.value.id,
            championId: t1.id,
            secondId: t2.id,
        });
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(true);
        if (!(0, result_1.isOk)(result))
            return;
        (0, vitest_1.expect)(result.value.championId?.value).toBe(t1.id.value);
        (0, vitest_1.expect)(result.value.secondId?.value).toBe(t2.id.value);
    });
    (0, vitest_1.it)('falla con NotFound cuando la temporada no existe', async () => {
        const seasonRepo = new InMemorySeasonRepository_1.InMemorySeasonRepository();
        const teamRepo = new InMemoryTeamRepository_1.InMemoryTeamRepository();
        const t1 = await (0, saveTeamInMemory_1.saveTeamInMemory)(teamRepo, 'T1');
        const t2 = await (0, saveTeamInMemory_1.saveTeamInMemory)(teamRepo, 'T2');
        const seasonId = SeasonId_value_object_1.SeasonId.generate();
        const setWinners = new SetSeasonWinners_use_case_1.SetSeasonWinners(seasonRepo, teamRepo);
        const result = await setWinners.execute({
            seasonId,
            championId: t1.id,
            secondId: t2.id,
        });
        (0, vitest_1.expect)(result.ok).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error.message).toContain('Season');
    });
    (0, vitest_1.it)('falla con NotFound cuando el campeón no existe', async () => {
        const leagueRepo = new InMemoryLeagueRepository_1.InMemoryLeagueRepository();
        const leagueId = LeagueId_value_object_1.LeagueId.generate();
        await leagueRepo.save(League_entity_1.League.create({ id: leagueId, name: 'Liga X', leagueCategory: 'PRIMERA' }));
        const seasonRepo = new InMemorySeasonRepository_1.InMemorySeasonRepository();
        const teamRepo = new InMemoryTeamRepository_1.InMemoryTeamRepository();
        const createSeason = new CreateSeason_use_case_1.CreateSeason(seasonRepo, leagueRepo);
        const createResult = await createSeason.execute({ year: 2025, leagueId });
        if (!(0, result_1.isOk)(createResult))
            throw new Error('Expected season create');
        const t2 = await (0, saveTeamInMemory_1.saveTeamInMemory)(teamRepo, 'Sub');
        const fakeChampionId = TeamId_value_object_1.TeamId.generate();
        const setWinners = new SetSeasonWinners_use_case_1.SetSeasonWinners(seasonRepo, teamRepo);
        const result = await setWinners.execute({
            seasonId: createResult.value.id,
            championId: fakeChampionId,
            secondId: t2.id,
        });
        (0, vitest_1.expect)(result.ok).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error.message).toContain('Team');
    });
    (0, vitest_1.it)('falla cuando campeón y subcampeón son el mismo equipo', async () => {
        const leagueRepo = new InMemoryLeagueRepository_1.InMemoryLeagueRepository();
        const leagueId = LeagueId_value_object_1.LeagueId.generate();
        await leagueRepo.save(League_entity_1.League.create({ id: leagueId, name: 'Liga X', leagueCategory: 'PRIMERA' }));
        const seasonRepo = new InMemorySeasonRepository_1.InMemorySeasonRepository();
        const teamRepo = new InMemoryTeamRepository_1.InMemoryTeamRepository();
        const createSeason = new CreateSeason_use_case_1.CreateSeason(seasonRepo, leagueRepo);
        const createResult = await createSeason.execute({ year: 2025, leagueId });
        if (!(0, result_1.isOk)(createResult))
            throw new Error('Expected season create');
        const team = await (0, saveTeamInMemory_1.saveTeamInMemory)(teamRepo, 'Mismo');
        const setWinners = new SetSeasonWinners_use_case_1.SetSeasonWinners(seasonRepo, teamRepo);
        const result = await setWinners.execute({
            seasonId: createResult.value.id,
            championId: team.id,
            secondId: team.id,
        });
        (0, vitest_1.expect)(result.ok).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error.message).toContain('diferentes');
    });
});
