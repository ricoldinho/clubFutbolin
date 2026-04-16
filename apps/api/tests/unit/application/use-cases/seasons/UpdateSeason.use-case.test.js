"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const UpdateSeason_use_case_1 = require("@/application/use-cases/seasons/UpdateSeason.use-case");
const InMemorySeasonRepository_1 = require("../../../../doubles/InMemorySeasonRepository");
const InMemoryLeagueRepository_1 = require("../../../../doubles/InMemoryLeagueRepository");
const CreateSeason_use_case_1 = require("@/application/use-cases/seasons/CreateSeason.use-case");
const League_entity_1 = require("@/domain/leagues/League.entity");
const LeagueId_value_object_1 = require("@/domain/leagues/LeagueId.value-object");
const SeasonId_value_object_1 = require("@/domain/seasons/SeasonId.value-object");
const result_1 = require("@/shared/result");
(0, vitest_1.describe)('UpdateSeason', () => {
    (0, vitest_1.it)('actualiza el año de una temporada', async () => {
        const leagueRepo = new InMemoryLeagueRepository_1.InMemoryLeagueRepository();
        const leagueId = LeagueId_value_object_1.LeagueId.generate();
        await leagueRepo.save(League_entity_1.League.create({ id: leagueId, name: 'Liga X', leagueCategory: 'PRIMERA' }));
        const seasonRepo = new InMemorySeasonRepository_1.InMemorySeasonRepository();
        const createSeason = new CreateSeason_use_case_1.CreateSeason(seasonRepo, leagueRepo);
        const createResult = await createSeason.execute({ year: 2025, leagueId });
        if (!(0, result_1.isOk)(createResult))
            throw new Error('Expected season create');
        const seasonId = createResult.value.id;
        const updateSeason = new UpdateSeason_use_case_1.UpdateSeason(seasonRepo);
        const result = await updateSeason.execute({
            id: seasonId,
            year: 2026,
        });
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(true);
        if (!(0, result_1.isOk)(result))
            return;
        (0, vitest_1.expect)(result.value.year).toBe(2026);
    });
    (0, vitest_1.it)('mantiene el año anterior cuando no se pasa year', async () => {
        const leagueRepo = new InMemoryLeagueRepository_1.InMemoryLeagueRepository();
        const leagueId = LeagueId_value_object_1.LeagueId.generate();
        await leagueRepo.save(League_entity_1.League.create({ id: leagueId, name: 'Liga Y', leagueCategory: 'ELITE' }));
        const seasonRepo = new InMemorySeasonRepository_1.InMemorySeasonRepository();
        const createSeason = new CreateSeason_use_case_1.CreateSeason(seasonRepo, leagueRepo);
        const createResult = await createSeason.execute({ year: 2024, leagueId });
        if (!(0, result_1.isOk)(createResult))
            throw new Error('Expected season create');
        const updateSeason = new UpdateSeason_use_case_1.UpdateSeason(seasonRepo);
        const result = await updateSeason.execute({
            id: createResult.value.id,
        });
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(true);
        if (!(0, result_1.isOk)(result))
            return;
        (0, vitest_1.expect)(result.value.year).toBe(2024);
    });
    (0, vitest_1.it)('falla con NotFound cuando la temporada no existe', async () => {
        const seasonRepo = new InMemorySeasonRepository_1.InMemorySeasonRepository();
        const seasonId = SeasonId_value_object_1.SeasonId.generate();
        const updateSeason = new UpdateSeason_use_case_1.UpdateSeason(seasonRepo);
        const result = await updateSeason.execute({ id: seasonId, year: 2026 });
        (0, vitest_1.expect)(result.ok).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error.message).toContain('Season');
    });
});
