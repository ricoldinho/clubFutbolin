"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLeagueById = void 0;
const errors_1 = require("@/domain/shared/errors");
const result_1 = require("@/shared/result");
/**
 * Obtiene una League por id. Público.
 */
class GetLeagueById {
    constructor(leagueRepository) {
        this.leagueRepository = leagueRepository;
    }
    async execute(id) {
        const league = await this.leagueRepository.findById(id);
        if (league === null) {
            return result_1.Result.fail(new errors_1.NotFoundError('League', id.value));
        }
        return result_1.Result.ok(league);
    }
}
exports.GetLeagueById = GetLeagueById;
