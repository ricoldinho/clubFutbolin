"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteTeam = void 0;
const errors_1 = require("@/domain/shared/errors");
const result_1 = require("@/shared/result");
/**
 * Elimina un Team. Solo ADMIN.
 */
class DeleteTeam {
    constructor(teamRepository) {
        this.teamRepository = teamRepository;
    }
    async execute(id) {
        const existing = await this.teamRepository.findById(id);
        if (existing === null) {
            return result_1.Result.fail(new errors_1.NotFoundError('Team', id.value));
        }
        await this.teamRepository.delete(id);
        return result_1.Result.ok(undefined);
    }
}
exports.DeleteTeam = DeleteTeam;
