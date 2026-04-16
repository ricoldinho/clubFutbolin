"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const UpdateTeam_use_case_1 = require("@/application/use-cases/teams/UpdateTeam.use-case");
const InMemoryTeamRepository_1 = require("../../../../doubles/InMemoryTeamRepository");
const saveTeamInMemory_1 = require("../../../../doubles/saveTeamInMemory");
const errors_1 = require("@/domain/shared/errors");
const TeamId_value_object_1 = require("@/domain/teams/TeamId.value-object");
const result_1 = require("@/shared/result");
(0, vitest_1.describe)('UpdateTeam', () => {
    (0, vitest_1.it)('actualiza un equipo existente', async () => {
        const repository = new InMemoryTeamRepository_1.InMemoryTeamRepository();
        const updateTeam = new UpdateTeam_use_case_1.UpdateTeam(repository);
        const created = await (0, saveTeamInMemory_1.saveTeamInMemory)(repository, 'Equipo X');
        const teamId = created.id;
        const result = await updateTeam.execute({
            id: teamId,
            name: 'Equipo X Actualizado',
        });
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(true);
        if (!(0, result_1.isOk)(result))
            return;
        (0, vitest_1.expect)(result.value.name).toBe('Equipo X Actualizado');
    });
    (0, vitest_1.it)('devuelve AlreadyExistsError cuando el nuevo nombre ya existe en otro equipo', async () => {
        const repository = new InMemoryTeamRepository_1.InMemoryTeamRepository();
        const updateTeam = new UpdateTeam_use_case_1.UpdateTeam(repository);
        const a = await (0, saveTeamInMemory_1.saveTeamInMemory)(repository, 'Equipo A');
        await (0, saveTeamInMemory_1.saveTeamInMemory)(repository, 'Equipo B');
        const result = await updateTeam.execute({
            id: a.id,
            name: 'Equipo B',
        });
        (0, vitest_1.expect)(result.ok).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error.message).toContain('Equipo B');
    });
    (0, vitest_1.it)('actualiza sin cambiar nombre cuando name no se pasa', async () => {
        const repository = new InMemoryTeamRepository_1.InMemoryTeamRepository();
        const updateTeam = new UpdateTeam_use_case_1.UpdateTeam(repository);
        const created = await (0, saveTeamInMemory_1.saveTeamInMemory)(repository, 'Equipo Original');
        const result = await updateTeam.execute({
            id: created.id,
        });
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(true);
        if (!(0, result_1.isOk)(result))
            return;
        (0, vitest_1.expect)(result.value.name).toBe('Equipo Original');
    });
    (0, vitest_1.it)('devuelve NotFoundError cuando el equipo no existe', async () => {
        const repository = new InMemoryTeamRepository_1.InMemoryTeamRepository();
        const updateTeam = new UpdateTeam_use_case_1.UpdateTeam(repository);
        const result = await updateTeam.execute({
            id: TeamId_value_object_1.TeamId.generate(),
            name: 'Nuevo',
        });
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error).toBeInstanceOf(errors_1.NotFoundError);
    });
});
