"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const GetSeasonById_use_case_1 = require("@/application/use-cases/seasons/GetSeasonById.use-case");
const CreateSeason_use_case_1 = require("@/application/use-cases/seasons/CreateSeason.use-case");
const InMemorySeasonRepository_1 = require("../../../../doubles/InMemorySeasonRepository");
const InMemoryLeagueRepository_1 = require("../../../../doubles/InMemoryLeagueRepository");
const League_entity_1 = require("@/domain/leagues/League.entity");
const LeagueId_value_object_1 = require("@/domain/leagues/LeagueId.value-object");
const SeasonId_value_object_1 = require("@/domain/seasons/SeasonId.value-object");
const errors_1 = require("@/domain/shared/errors");
const result_1 = require("@/shared/result");
(0, vitest_1.describe)('GetSeasonById', () => {
    (0, vitest_1.it)('devuelve Result.ok(Season) cuando la temporada existe', async () => {
        const leagueRepo = new InMemoryLeagueRepository_1.InMemoryLeagueRepository();
        const leagueId = LeagueId_value_object_1.LeagueId.generate();
        await leagueRepo.save(League_entity_1.League.create({ id: leagueId, name: 'Liga Y', leagueCategory: 'SEGUNDA' }));
        const seasonRepo = new InMemorySeasonRepository_1.InMemorySeasonRepository();
        const createSeason = new CreateSeason_use_case_1.CreateSeason(seasonRepo, leagueRepo);
        const created = await createSeason.execute({ year: 2026, leagueId });
        if (!(0, result_1.isOk)(created))
            throw new Error('Expected season create');
        const seasonId = created.value.id;
        const getSeasonById = new GetSeasonById_use_case_1.GetSeasonById(seasonRepo);
        const result = await getSeasonById.execute(seasonId);
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(true);
        if (!(0, result_1.isOk)(result))
            return;
        (0, vitest_1.expect)(result.value.id?.value).toBe(seasonId.value);
        (0, vitest_1.expect)(result.value.year).toBe(2026);
        (0, vitest_1.expect)(result.value.leagueId.value).toBe(leagueId.value);
    });
    (0, vitest_1.it)('devuelve Result.fail(NotFoundError) cuando la temporada no existe', async () => {
        const seasonRepo = new InMemorySeasonRepository_1.InMemorySeasonRepository();
        const getSeasonById = new GetSeasonById_use_case_1.GetSeasonById(seasonRepo);
        const id = SeasonId_value_object_1.SeasonId.generate();
        const result = await getSeasonById.execute(id);
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error).toBeInstanceOf(errors_1.NotFoundError);
        (0, vitest_1.expect)(result.error.message).toContain('Season');
    });
});
