"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ListLeagues_use_case_1 = require("@/application/use-cases/leagues/ListLeagues.use-case");
const InMemoryLeagueRepository_1 = require("../../../../doubles/InMemoryLeagueRepository");
const League_entity_1 = require("@/domain/leagues/League.entity");
const LeagueId_value_object_1 = require("@/domain/leagues/LeagueId.value-object");
const result_1 = require("@/shared/result");
(0, vitest_1.describe)('ListLeagues', () => {
    (0, vitest_1.it)('devuelve Result.ok([]) cuando no hay ligas', async () => {
        const repository = new InMemoryLeagueRepository_1.InMemoryLeagueRepository();
        const listLeagues = new ListLeagues_use_case_1.ListLeagues(repository);
        const result = await listLeagues.execute({ pagination: { page: 1, limit: 20 } });
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(true);
        if (!(0, result_1.isOk)(result))
            return;
        (0, vitest_1.expect)(result.value.data).toEqual([]);
        (0, vitest_1.expect)(result.value.total).toBe(0);
    });
    (0, vitest_1.it)('devuelve Result.ok con todas las ligas guardadas', async () => {
        const repository = new InMemoryLeagueRepository_1.InMemoryLeagueRepository();
        await repository.save(League_entity_1.League.create({ id: LeagueId_value_object_1.LeagueId.generate(), name: 'Liga A', leagueCategory: 'PRIMERA' }));
        await repository.save(League_entity_1.League.create({ id: LeagueId_value_object_1.LeagueId.generate(), name: 'Liga B', leagueCategory: 'SEGUNDA' }));
        const listLeagues = new ListLeagues_use_case_1.ListLeagues(repository);
        const result = await listLeagues.execute({ pagination: { page: 1, limit: 20 } });
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(true);
        if (!(0, result_1.isOk)(result))
            return;
        (0, vitest_1.expect)(result.value.data).toHaveLength(2);
        (0, vitest_1.expect)(result.value.total).toBe(2);
        const names = result.value.data.map((l) => l.name).sort();
        (0, vitest_1.expect)(names).toEqual(['Liga A', 'Liga B']);
    });
});
