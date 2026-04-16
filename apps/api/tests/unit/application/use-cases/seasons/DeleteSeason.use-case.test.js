"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const DeleteSeason_use_case_1 = require("@/application/use-cases/seasons/DeleteSeason.use-case");
const InMemorySeasonRepository_1 = require("../../../../doubles/InMemorySeasonRepository");
const InMemoryLeagueRepository_1 = require("../../../../doubles/InMemoryLeagueRepository");
const CreateSeason_use_case_1 = require("@/application/use-cases/seasons/CreateSeason.use-case");
const League_entity_1 = require("@/domain/leagues/League.entity");
const LeagueId_value_object_1 = require("@/domain/leagues/LeagueId.value-object");
const SeasonId_value_object_1 = require("@/domain/seasons/SeasonId.value-object");
const result_1 = require("@/shared/result");
(0, vitest_1.describe)('DeleteSeason', () => {
    (0, vitest_1.it)('elimina una temporada existente', async () => {
        const leagueRepo = new InMemoryLeagueRepository_1.InMemoryLeagueRepository();
        const leagueId = LeagueId_value_object_1.LeagueId.generate();
        await leagueRepo.save(League_entity_1.League.create({ id: leagueId, name: 'Liga X', leagueCategory: 'PRIMERA' }));
        const seasonRepo = new InMemorySeasonRepository_1.InMemorySeasonRepository();
        const createSeason = new CreateSeason_use_case_1.CreateSeason(seasonRepo, leagueRepo);
        const createResult = await createSeason.execute({ year: 2025, leagueId });
        if (!(0, result_1.isOk)(createResult))
            throw new Error('Expected season create');
        const seasonId = createResult.value.id;
        const deleteSeason = new DeleteSeason_use_case_1.DeleteSeason(seasonRepo);
        const result = await deleteSeason.execute(seasonId);
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(true);
        const found = await seasonRepo.findById(seasonId);
        (0, vitest_1.expect)(found).toBeNull();
    });
    (0, vitest_1.it)('falla con NotFound cuando la temporada no existe', async () => {
        const seasonRepo = new InMemorySeasonRepository_1.InMemorySeasonRepository();
        const seasonId = SeasonId_value_object_1.SeasonId.generate();
        const deleteSeason = new DeleteSeason_use_case_1.DeleteSeason(seasonRepo);
        const result = await deleteSeason.execute(seasonId);
        (0, vitest_1.expect)(result.ok).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error.message).toContain('Season');
    });
});
