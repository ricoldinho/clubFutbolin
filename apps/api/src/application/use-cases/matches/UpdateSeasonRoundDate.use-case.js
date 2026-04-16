"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSeasonRoundDate = void 0;
const errors_1 = require("@/domain/shared/errors");
const result_1 = require("@/shared/result");
/**
 * Actualiza la fecha de todos los partidos de una jornada concreta de una season.
 * Solo ADMIN desde capa HTTP.
 */
class UpdateSeasonRoundDate {
    constructor(matchRepository) {
        this.matchRepository = matchRepository;
    }
    async execute(input) {
        const updatedMatches = await this.matchRepository.updateRoundDate(input.seasonId, input.round, input.date);
        if (updatedMatches === 0) {
            return result_1.Result.fail(new errors_1.NotFoundError('Season round', `${input.seasonId.value}#${input.round}`));
        }
        return result_1.Result.ok({ updatedMatches });
    }
}
exports.UpdateSeasonRoundDate = UpdateSeasonRoundDate;
