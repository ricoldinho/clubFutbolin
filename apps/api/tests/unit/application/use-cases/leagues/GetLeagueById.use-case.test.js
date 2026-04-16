"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const GetLeagueById_use_case_1 = require("@/application/use-cases/leagues/GetLeagueById.use-case");
const InMemoryLeagueRepository_1 = require("../../../../doubles/InMemoryLeagueRepository");
const League_entity_1 = require("@/domain/leagues/League.entity");
const LeagueId_value_object_1 = require("@/domain/leagues/LeagueId.value-object");
const errors_1 = require("@/domain/shared/errors");
const result_1 = require("@/shared/result");
(0, vitest_1.describe)('GetLeagueById', () => {
    (0, vitest_1.it)('devuelve Result.ok(League) cuando la liga existe', async () => {
        const id = LeagueId_value_object_1.LeagueId.generate();
        const repository = new InMemoryLeagueRepository_1.InMemoryLeagueRepository();
        await repository.save(League_entity_1.League.create({ id, name: 'Liga Test', leagueCategory: 'ELITE' }));
        const getLeagueById = new GetLeagueById_use_case_1.GetLeagueById(repository);
        const result = await getLeagueById.execute(id);
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(true);
        if (!(0, result_1.isOk)(result))
            return;
        (0, vitest_1.expect)(result.value.id?.value).toBe(id.value);
        (0, vitest_1.expect)(result.value.name).toBe('Liga Test');
        (0, vitest_1.expect)(result.value.leagueCategory).toBe('ELITE');
    });
    (0, vitest_1.it)('devuelve Result.fail(NotFoundError) cuando la liga no existe', async () => {
        const repository = new InMemoryLeagueRepository_1.InMemoryLeagueRepository();
        const getLeagueById = new GetLeagueById_use_case_1.GetLeagueById(repository);
        const id = LeagueId_value_object_1.LeagueId.generate();
        const result = await getLeagueById.execute(id);
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error).toBeInstanceOf(errors_1.NotFoundError);
        (0, vitest_1.expect)(result.error.message).toContain('League');
    });
});
