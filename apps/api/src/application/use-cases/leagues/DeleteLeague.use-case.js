"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteLeague = void 0;
const errors_1 = require("@/domain/shared/errors");
const result_1 = require("@/shared/result");
/**
 * Elimina una League. Solo ADMIN.
 * Si la liga tiene Seasons asociadas, falla con DomainValidationError.
 */
class DeleteLeague {
    constructor(leagueRepository) {
        this.leagueRepository = leagueRepository;
    }
    async execute(id) {
        const existing = await this.leagueRepository.findById(id);
        if (existing === null) {
            return result_1.Result.fail(new errors_1.NotFoundError('League', id.value));
        }
        const seasonCount = await this.leagueRepository.countSeasonsByLeagueId(id);
        if (seasonCount > 0) {
            return result_1.Result.fail(new errors_1.DomainValidationError(`No se puede eliminar la liga: tiene ${seasonCount} temporada(s) asociada(s)`));
        }
        await this.leagueRepository.delete(id);
        return result_1.Result.ok(undefined);
    }
}
exports.DeleteLeague = DeleteLeague;
