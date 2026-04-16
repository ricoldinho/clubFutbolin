"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const CreateLeague_use_case_1 = require("@/application/use-cases/leagues/CreateLeague.use-case");
const InMemoryLeagueRepository_1 = require("../../../../doubles/InMemoryLeagueRepository");
const errors_1 = require("@/domain/shared/errors");
const result_1 = require("@/shared/result");
const League_entity_1 = require("@/domain/leagues/League.entity");
const LeagueId_value_object_1 = require("@/domain/leagues/LeagueId.value-object");
(0, vitest_1.describe)('CreateLeague', () => {
    (0, vitest_1.it)('crea una liga y devuelve Result.ok', async () => {
        // Arrange
        const repository = new InMemoryLeagueRepository_1.InMemoryLeagueRepository();
        const createLeague = new CreateLeague_use_case_1.CreateLeague(repository);
        // Act
        const result = await createLeague.execute({
            name: 'Liga Provincial',
            leagueCategory: 'PRIMERA',
        });
        // Assert
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(true);
        if (!(0, result_1.isOk)(result))
            return;
        (0, vitest_1.expect)(result.value.league.name).toBe('Liga Provincial');
        (0, vitest_1.expect)(result.value.league.leagueCategory).toBe('PRIMERA');
        (0, vitest_1.expect)(result.value.league.id).toBeInstanceOf(LeagueId_value_object_1.LeagueId);
        (0, vitest_1.expect)(result.value.initialSeason.leagueId.equals(result.value.league.id)).toBe(true);
        (0, vitest_1.expect)(result.value.initialSeason.year).toBe(new Date().getFullYear());
    });
    (0, vitest_1.it)('devuelve Result.fail(AlreadyExistsError) cuando ya existe una liga con el mismo nombre', async () => {
        // Arrange
        const repository = new InMemoryLeagueRepository_1.InMemoryLeagueRepository();
        const createLeague = new CreateLeague_use_case_1.CreateLeague(repository);
        await repository.save(League_entity_1.League.create({
            id: LeagueId_value_object_1.LeagueId.generate(),
            name: 'Liga Provincial',
            leagueCategory: 'PRIMERA',
        }));
        // Act
        const result = await createLeague.execute({
            name: 'Liga Provincial',
            leagueCategory: 'SEGUNDA',
        });
        // Assert
        (0, vitest_1.expect)((0, result_1.isOk)(result)).toBe(false);
        if (result.ok)
            return;
        (0, vitest_1.expect)(result.error).toBeInstanceOf(errors_1.AlreadyExistsError);
    });
});
