"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateSeason = void 0;
const Season_entity_1 = require("@/domain/seasons/Season.entity");
const SeasonId_value_object_1 = require("@/domain/seasons/SeasonId.value-object");
const errors_1 = require("@/domain/shared/errors");
const result_1 = require("@/shared/result");
/**
 * Crea una nueva Season. Solo ADMIN.
 */
class CreateSeason {
    constructor(seasonRepository, leagueRepository) {
        this.seasonRepository = seasonRepository;
        this.leagueRepository = leagueRepository;
    }
    async execute(input) {
        const league = await this.leagueRepository.findById(input.leagueId);
        if (league === null) {
            return result_1.Result.fail(new errors_1.NotFoundError('League', input.leagueId.value));
        }
        const existing = await this.seasonRepository.findByLeagueId(input.leagueId);
        const duplicateYear = existing.some((s) => s.year === input.year);
        if (duplicateYear) {
            return result_1.Result.fail(new errors_1.AlreadyExistsError('Season', `año ${input.year} en esta liga`));
        }
        const season = Season_entity_1.Season.create({
            id: SeasonId_value_object_1.SeasonId.generate(),
            year: input.year,
            leagueId: input.leagueId,
        });
        await this.seasonRepository.save(season);
        return result_1.Result.ok(season);
    }
}
exports.CreateSeason = CreateSeason;
