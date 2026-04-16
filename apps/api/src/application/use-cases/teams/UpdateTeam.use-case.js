"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTeam = void 0;
const Team_entity_1 = require("@/domain/teams/Team.entity");
const errors_1 = require("@/domain/shared/errors");
const result_1 = require("@/shared/result");
/**
 * Actualiza un Team existente. Solo ADMIN.
 */
class UpdateTeam {
    constructor(teamRepository) {
        this.teamRepository = teamRepository;
    }
    async execute(input) {
        const existing = await this.teamRepository.findById(input.id);
        if (existing === null) {
            return result_1.Result.fail(new errors_1.NotFoundError('Team', input.id.value));
        }
        if (input.name !== undefined) {
            const byName = await this.teamRepository.findByName(input.name.trim());
            if (byName !== null && !byName.id?.equals(input.id)) {
                return result_1.Result.fail(new errors_1.AlreadyExistsError('Team', `nombre "${input.name}"`));
            }
        }
        const updated = Team_entity_1.Team.create({
            id: input.id,
            name: input.name?.trim() ?? existing.name,
            createdAt: existing.createdAt,
        });
        await this.teamRepository.save(updated);
        return result_1.Result.ok(updated);
    }
}
exports.UpdateTeam = UpdateTeam;
