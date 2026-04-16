"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSeason = void 0;
const Season_entity_1 = require("@/domain/seasons/Season.entity");
const errors_1 = require("@/domain/shared/errors");
const result_1 = require("@/shared/result");
/**
 * Actualiza una Season. Solo ADMIN.
 */
class UpdateSeason {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(input) {
        const existing = await this.repository.findById(input.id);
        if (existing === null) {
            return result_1.Result.fail(new errors_1.NotFoundError('Season', input.id.value));
        }
        const updated = Season_entity_1.Season.create({
            id: input.id,
            year: input.year ?? existing.year,
            leagueId: existing.leagueId,
            championId: existing.championId,
            secondId: existing.secondId,
        });
        await this.repository.save(updated);
        return result_1.Result.ok(updated);
    }
}
exports.UpdateSeason = UpdateSeason;
