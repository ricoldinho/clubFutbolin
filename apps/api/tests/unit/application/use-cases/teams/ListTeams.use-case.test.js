"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ListTeams_use_case_1 = require("@/application/use-cases/teams/ListTeams.use-case");
const InMemoryTeamRepository_1 = require("../../../../doubles/InMemoryTeamRepository");
const saveTeamInMemory_1 = require("../../../../doubles/saveTeamInMemory");
const result_1 = require("@/shared/result");
(0, vitest_1.describe)('ListTeams', () => {
    (0, vitest_1.it)('devuelve Result.ok([]) cuando no hay equipos', async () => {
        const repository = new InMemoryTeamRepository_1.InMemoryTeamRepository();
        const listTeams = new ListTeams_use_case_1.ListTeams(repository);
        const result = await listTeams.execute({ pagination: { page: 1, limit: 20 } });
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(true);
        if (!(0, result_1.isOk)(result))
            return;
        (0, vitest_1.expect)(result.value.data).toEqual([]);
        (0, vitest_1.expect)(result.value.total).toBe(0);
    });
    (0, vitest_1.it)('devuelve Result.ok con todos los equipos guardados', async () => {
        const repository = new InMemoryTeamRepository_1.InMemoryTeamRepository();
        await (0, saveTeamInMemory_1.saveTeamInMemory)(repository, 'Equipo Uno');
        await (0, saveTeamInMemory_1.saveTeamInMemory)(repository, 'Equipo Dos');
        const listTeams = new ListTeams_use_case_1.ListTeams(repository);
        const result = await listTeams.execute({ pagination: { page: 1, limit: 20 } });
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(true);
        if (!(0, result_1.isOk)(result))
            return;
        (0, vitest_1.expect)(result.value.data).toHaveLength(2);
        (0, vitest_1.expect)(result.value.total).toBe(2);
        const names = result.value.data.map((t) => t.name).sort();
        (0, vitest_1.expect)(names).toEqual(['Equipo Dos', 'Equipo Uno']);
    });
    (0, vitest_1.it)('con searchQuery solo devuelve equipos cuyo nombre coincide', async () => {
        const repository = new InMemoryTeamRepository_1.InMemoryTeamRepository();
        await (0, saveTeamInMemory_1.saveTeamInMemory)(repository, 'Atlético Norte');
        await (0, saveTeamInMemory_1.saveTeamInMemory)(repository, 'Betis Sur');
        const listTeams = new ListTeams_use_case_1.ListTeams(repository);
        const result = await listTeams.execute({
            pagination: { page: 1, limit: 20 },
            searchQuery: 'Atl',
        });
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(true);
        if (!(0, result_1.isOk)(result))
            return;
        (0, vitest_1.expect)(result.value.total).toBe(1);
        (0, vitest_1.expect)(result.value.data[0].name).toBe('Atlético Norte');
    });
});
