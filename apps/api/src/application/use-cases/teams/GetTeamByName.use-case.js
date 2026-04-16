"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTeamByName = void 0;
const errors_1 = require("@/domain/shared/errors");
const result_1 = require("@/shared/result");
/**
 * Obtiene un Team por nombre. Público.
 */
class GetTeamByName {
    constructor(teamRepository) {
        this.teamRepository = teamRepository;
    }
    async execute(name) {
        const team = await this.teamRepository.findByName(name.trim());
        if (team === null) {
            return result_1.Result.fail(new errors_1.NotFoundError('Team', `nombre "${name}"`));
        }
        return result_1.Result.ok(team);
    }
}
exports.GetTeamByName = GetTeamByName;
