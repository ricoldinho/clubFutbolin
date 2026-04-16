"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const GetTeamByName_use_case_1 = require("@/application/use-cases/teams/GetTeamByName.use-case");
const InMemoryTeamRepository_1 = require("../../../../doubles/InMemoryTeamRepository");
const saveTeamInMemory_1 = require("../../../../doubles/saveTeamInMemory");
const result_1 = require("@/shared/result");
(0, vitest_1.describe)('GetTeamByName', () => {
    (0, vitest_1.it)('devuelve el equipo cuando existe', async () => {
        const repo = new InMemoryTeamRepository_1.InMemoryTeamRepository();
        await (0, saveTeamInMemory_1.saveTeamInMemory)(repo, 'Equipo Alpha');
        const getTeam = new GetTeamByName_use_case_1.GetTeamByName(repo);
        const result = await getTeam.execute('Equipo Alpha');
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(true);
        if (!(0, result_1.isOk)(result))
            return;
        (0, vitest_1.expect)(result.value.name).toBe('Equipo Alpha');
    });
    (0, vitest_1.it)('falla con NotFound cuando el equipo no existe', async () => {
        const repo = new InMemoryTeamRepository_1.InMemoryTeamRepository();
        const getTeam = new GetTeamByName_use_case_1.GetTeamByName(repo);
        const result = await getTeam.execute('No Existe');
        (0, vitest_1.expect)(result.ok).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error.message).toContain('Team');
        (0, vitest_1.expect)(result.error.message).toContain('No Existe');
    });
});
