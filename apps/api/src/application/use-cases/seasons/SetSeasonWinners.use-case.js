"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetSeasonWinners = void 0;
const errors_1 = require("@/domain/shared/errors");
const result_1 = require("@/shared/result");
/**
 * Asigna campeón y subcampeón a una Season. Solo ADMIN.
 */
class SetSeasonWinners {
    constructor(seasonRepository, teamRepository) {
        this.seasonRepository = seasonRepository;
        this.teamRepository = teamRepository;
    }
    async execute(input) {
        const season = await this.seasonRepository.findById(input.seasonId);
        if (season === null) {
            return result_1.Result.fail(new errors_1.NotFoundError('Season', input.seasonId.value));
        }
        const champion = await this.teamRepository.findById(input.championId);
        const second = await this.teamRepository.findById(input.secondId);
        if (champion === null) {
            return result_1.Result.fail(new errors_1.NotFoundError('Team', input.championId.value));
        }
        if (second === null) {
            return result_1.Result.fail(new errors_1.NotFoundError('Team', input.secondId.value));
        }
        try {
            const updated = season.setWinners(input.championId, input.secondId);
            await this.seasonRepository.save(updated);
            return result_1.Result.ok(updated);
        }
        catch (err) {
            if (err instanceof errors_1.DomainValidationError) {
                return result_1.Result.fail(err);
            }
            throw err;
        }
    }
}
exports.SetSeasonWinners = SetSeasonWinners;
