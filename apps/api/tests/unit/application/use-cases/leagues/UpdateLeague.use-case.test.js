"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const CreateLeague_use_case_1 = require("@/application/use-cases/leagues/CreateLeague.use-case");
const UpdateLeague_use_case_1 = require("@/application/use-cases/leagues/UpdateLeague.use-case");
const InMemoryLeagueRepository_1 = require("../../../../doubles/InMemoryLeagueRepository");
const errors_1 = require("@/domain/shared/errors");
const LeagueId_value_object_1 = require("@/domain/leagues/LeagueId.value-object");
const result_1 = require("@/shared/result");
(0, vitest_1.describe)('UpdateLeague', () => {
    (0, vitest_1.it)('actualiza una liga existente', async () => {
        const repository = new InMemoryLeagueRepository_1.InMemoryLeagueRepository();
        const createLeague = new CreateLeague_use_case_1.CreateLeague(repository);
        const updateLeague = new UpdateLeague_use_case_1.UpdateLeague(repository);
        const createResult = await createLeague.execute({
            name: 'Liga A',
            leagueCategory: 'PRIMERA',
        });
        if (!(0, result_1.isOk)(createResult))
            throw new Error('Expected create to succeed');
        const leagueId = createResult.value.league.id;
        const result = await updateLeague.execute({
            id: leagueId,
            name: 'Liga A Actualizada',
        });
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(true);
        if (!(0, result_1.isOk)(result))
            return;
        (0, vitest_1.expect)(result.value.name).toBe('Liga A Actualizada');
        (0, vitest_1.expect)(result.value.leagueCategory).toBe('PRIMERA');
    });
    (0, vitest_1.it)('devuelve NotFoundError cuando la liga no existe', async () => {
        const repository = new InMemoryLeagueRepository_1.InMemoryLeagueRepository();
        const updateLeague = new UpdateLeague_use_case_1.UpdateLeague(repository);
        const result = await updateLeague.execute({
            id: LeagueId_value_object_1.LeagueId.generate(),
            name: 'Nueva',
        });
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error).toBeInstanceOf(errors_1.NotFoundError);
    });
});
