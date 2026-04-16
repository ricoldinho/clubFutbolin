"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetMatchById = void 0;
const errors_1 = require("@/domain/shared/errors");
const result_1 = require("@/shared/result");
/**
 * Obtiene un Match por id. Público.
 */
class GetMatchById {
    constructor(matchRepository) {
        this.matchRepository = matchRepository;
    }
    async execute(matchId) {
        const match = await this.matchRepository.findById(matchId);
        if (match === null) {
            return result_1.Result.fail(new errors_1.NotFoundError('Match', matchId.value));
        }
        return result_1.Result.ok(match);
    }
}
exports.GetMatchById = GetMatchById;
