"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const CreateSeason_use_case_1 = require("@/application/use-cases/seasons/CreateSeason.use-case");
const InMemorySeasonRepository_1 = require("../../../../doubles/InMemorySeasonRepository");
const InMemoryLeagueRepository_1 = require("../../../../doubles/InMemoryLeagueRepository");
const League_entity_1 = require("@/domain/leagues/League.entity");
const LeagueId_value_object_1 = require("@/domain/leagues/LeagueId.value-object");
const errors_1 = require("@/domain/shared/errors");
const result_1 = require("@/shared/result");
(0, vitest_1.describe)('CreateSeason', () => {
    (0, vitest_1.it)('crea una temporada y devuelve Result.ok', async () => {
        const leagueRepo = new InMemoryLeagueRepository_1.InMemoryLeagueRepository();
        const leagueId = LeagueId_value_object_1.LeagueId.generate();
        await leagueRepo.save(League_entity_1.League.create({ id: leagueId, name: 'Liga A', leagueCategory: 'PRIMERA' }));
        const seasonRepo = new InMemorySeasonRepository_1.InMemorySeasonRepository();
        const createSeason = new CreateSeason_use_case_1.CreateSeason(seasonRepo, leagueRepo);
        const result = await createSeason.execute({ year: 2025, leagueId });
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(true);
        if (!(0, result_1.isOk)(result))
            return;
        (0, vitest_1.expect)(result.value.year).toBe(2025);
        (0, vitest_1.expect)(result.value.leagueId.value).toBe(leagueId.value);
    });
    (0, vitest_1.it)('devuelve NotFoundError cuando la liga no existe', async () => {
        const seasonRepo = new InMemorySeasonRepository_1.InMemorySeasonRepository();
        const leagueRepo = new InMemoryLeagueRepository_1.InMemoryLeagueRepository();
        const createSeason = new CreateSeason_use_case_1.CreateSeason(seasonRepo, leagueRepo);
        const result = await createSeason.execute({
            year: 2025,
            leagueId: LeagueId_value_object_1.LeagueId.generate(),
        });
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error).toBeInstanceOf(errors_1.NotFoundError);
    });
});
