"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const CreateLeague_use_case_1 = require("@/application/use-cases/leagues/CreateLeague.use-case");
const DeleteLeague_use_case_1 = require("@/application/use-cases/leagues/DeleteLeague.use-case");
const InMemoryLeagueRepository_1 = require("../../../../doubles/InMemoryLeagueRepository");
const errors_1 = require("@/domain/shared/errors");
const result_1 = require("@/shared/result");
const League_entity_1 = require("@/domain/leagues/League.entity");
const LeagueId_value_object_1 = require("@/domain/leagues/LeagueId.value-object");
(0, vitest_1.describe)('DeleteLeague', () => {
    (0, vitest_1.it)('elimina una liga y devuelve Result.ok', async () => {
        // Arrange
        const repository = new InMemoryLeagueRepository_1.InMemoryLeagueRepository();
        const deleteLeague = new DeleteLeague_use_case_1.DeleteLeague(repository);
        await repository.save(League_entity_1.League.create({
            id: LeagueId_value_object_1.LeagueId.generate(),
            name: 'Liga Provincial',
            leagueCategory: 'PRIMERA',
        }));
        const created = await repository.findAll();
        const leagueId = created[0].id;
        // Act
        const result = await deleteLeague.execute(leagueId);
        // Assert
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(true);
        const found = await repository.findById(leagueId);
        (0, vitest_1.expect)(found).toBeNull();
    });
    (0, vitest_1.it)('devuelve Result.fail(NotFoundError) cuando la liga no existe', async () => {
        const repository = new InMemoryLeagueRepository_1.InMemoryLeagueRepository();
        const deleteLeague = new DeleteLeague_use_case_1.DeleteLeague(repository);
        const fakeId = LeagueId_value_object_1.LeagueId.generate();
        const result = await deleteLeague.execute(fakeId);
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error).toBeInstanceOf(errors_1.NotFoundError);
    });
    (0, vitest_1.it)('devuelve Result.fail(DomainValidationError) cuando la liga tiene temporadas', async () => {
        const repository = new InMemoryLeagueRepository_1.InMemoryLeagueRepository();
        const createLeague = new CreateLeague_use_case_1.CreateLeague(repository);
        const deleteLeague = new DeleteLeague_use_case_1.DeleteLeague(repository);
        const createResult = await createLeague.execute({
            name: 'Liga Con Temporadas',
            leagueCategory: 'ELITE',
        });
        if (!(0, result_1.isOk)(createResult))
            throw new Error('Expected create to succeed');
        const leagueId = createResult.value.league.id;
        repository.setSeasonCount(leagueId, 2);
        const result = await deleteLeague.execute(leagueId);
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error).toBeInstanceOf(errors_1.DomainValidationError);
        (0, vitest_1.expect)(result.error.message).toContain('2');
    });
});
