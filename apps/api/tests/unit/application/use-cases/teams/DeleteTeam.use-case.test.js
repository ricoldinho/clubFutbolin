"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const DeleteTeam_use_case_1 = require("@/application/use-cases/teams/DeleteTeam.use-case");
const InMemoryTeamRepository_1 = require("../../../../doubles/InMemoryTeamRepository");
const saveTeamInMemory_1 = require("../../../../doubles/saveTeamInMemory");
const errors_1 = require("@/domain/shared/errors");
const TeamId_value_object_1 = require("@/domain/teams/TeamId.value-object");
const result_1 = require("@/shared/result");
(0, vitest_1.describe)('DeleteTeam', () => {
    (0, vitest_1.it)('elimina un equipo y devuelve Result.ok', async () => {
        const repository = new InMemoryTeamRepository_1.InMemoryTeamRepository();
        const deleteTeam = new DeleteTeam_use_case_1.DeleteTeam(repository);
        const created = await (0, saveTeamInMemory_1.saveTeamInMemory)(repository, 'Equipo Y');
        const teamId = created.id;
        const result = await deleteTeam.execute(teamId);
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(true);
        const found = await repository.findById(teamId);
        (0, vitest_1.expect)(found).toBeNull();
    });
    (0, vitest_1.it)('devuelve Result.fail(NotFoundError) cuando el equipo no existe', async () => {
        const repository = new InMemoryTeamRepository_1.InMemoryTeamRepository();
        const deleteTeam = new DeleteTeam_use_case_1.DeleteTeam(repository);
        const result = await deleteTeam.execute(TeamId_value_object_1.TeamId.generate());
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error).toBeInstanceOf(errors_1.NotFoundError);
    });
});
