"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateLeague = void 0;
const League_entity_1 = require("@/domain/leagues/League.entity");
const LeagueId_value_object_1 = require("@/domain/leagues/LeagueId.value-object");
const errors_1 = require("@/domain/shared/errors");
const result_1 = require("@/shared/result");
/**
 * Crea una nueva League. Solo ADMIN.
 * Crea además la season inicial con el año actual.
 * Si ya existe una liga con el mismo nombre, devuelve AlreadyExistsError (409).
 */
class CreateLeague {
    constructor(leagueRepository) {
        this.leagueRepository = leagueRepository;
    }
    async execute(input) {
        const existing = await this.leagueRepository.findAll();
        const nameExists = existing.some((l) => l.name.toLowerCase() === input.name.trim().toLowerCase());
        if (nameExists) {
            return result_1.Result.fail(new errors_1.AlreadyExistsError('League', `nombre "${input.name}"`));
        }
        const league = League_entity_1.League.create({
            id: LeagueId_value_object_1.LeagueId.generate(),
            name: input.name.trim(),
            leagueCategory: input.leagueCategory,
        });
        const initialSeason = await this.leagueRepository.createWithInitialSeason(league, new Date().getFullYear());
        return result_1.Result.ok({ league, initialSeason });
    }
}
exports.CreateLeague = CreateLeague;
