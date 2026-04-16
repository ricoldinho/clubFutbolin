"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetSeasonById = void 0;
const errors_1 = require("@/domain/shared/errors");
const result_1 = require("@/shared/result");
/**
 * Obtiene una Season por id. Público.
 */
class GetSeasonById {
    constructor(seasonRepository) {
        this.seasonRepository = seasonRepository;
    }
    async execute(id) {
        const season = await this.seasonRepository.findById(id);
        if (season === null) {
            return result_1.Result.fail(new errors_1.NotFoundError('Season', id.value));
        }
        return result_1.Result.ok(season);
    }
}
exports.GetSeasonById = GetSeasonById;
