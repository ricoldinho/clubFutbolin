"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ListSeasons_use_case_1 = require("@/application/use-cases/seasons/ListSeasons.use-case");
const CreateSeason_use_case_1 = require("@/application/use-cases/seasons/CreateSeason.use-case");
const InMemorySeasonRepository_1 = require("../../../../doubles/InMemorySeasonRepository");
const InMemoryLeagueRepository_1 = require("../../../../doubles/InMemoryLeagueRepository");
const League_entity_1 = require("@/domain/leagues/League.entity");
const LeagueId_value_object_1 = require("@/domain/leagues/LeagueId.value-object");
const result_1 = require("@/shared/result");
(0, vitest_1.describe)('ListSeasons', () => {
    (0, vitest_1.it)('devuelve Result.ok([]) cuando no hay temporadas', async () => {
        const repository = new InMemorySeasonRepository_1.InMemorySeasonRepository();
        const listSeasons = new ListSeasons_use_case_1.ListSeasons(repository);
        const result = await listSeasons.execute({ pagination: { page: 1, limit: 20 } });
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(true);
        if (!(0, result_1.isOk)(result))
            return;
        (0, vitest_1.expect)(result.value.data).toEqual([]);
        (0, vitest_1.expect)(result.value.total).toBe(0);
    });
    (0, vitest_1.it)('devuelve Result.ok con todas las temporadas guardadas', async () => {
        const leagueRepo = new InMemoryLeagueRepository_1.InMemoryLeagueRepository();
        const leagueId = LeagueId_value_object_1.LeagueId.generate();
        await leagueRepo.save(League_entity_1.League.create({ id: leagueId, name: 'Liga X', leagueCategory: 'PRIMERA' }));
        const seasonRepo = new InMemorySeasonRepository_1.InMemorySeasonRepository();
        const createSeason = new CreateSeason_use_case_1.CreateSeason(seasonRepo, leagueRepo);
        const s1 = await createSeason.execute({ year: 2024, leagueId });
        const s2 = await createSeason.execute({ year: 2025, leagueId });
        if (!(0, result_1.isOk)(s1) || !(0, result_1.isOk)(s2))
            throw new Error('Expected season create');
        const listSeasons = new ListSeasons_use_case_1.ListSeasons(seasonRepo);
        const result = await listSeasons.execute({ pagination: { page: 1, limit: 20 } });
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(true);
        if (!(0, result_1.isOk)(result))
            return;
        (0, vitest_1.expect)(result.value.data).toHaveLength(2);
        (0, vitest_1.expect)(result.value.total).toBe(2);
        const years = result.value.data.map((s) => s.year).sort();
        (0, vitest_1.expect)(years).toEqual([2024, 2025]);
    });
});
