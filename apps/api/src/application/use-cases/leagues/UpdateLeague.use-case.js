"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateLeague = void 0;
const League_entity_1 = require("@/domain/leagues/League.entity");
const errors_1 = require("@/domain/shared/errors");
const result_1 = require("@/shared/result");
/**
 * Actualiza una League existente. Solo ADMIN.
 */
class UpdateLeague {
    constructor(leagueRepository) {
        this.leagueRepository = leagueRepository;
    }
    async execute(input) {
        const existing = await this.leagueRepository.findById(input.id);
        if (existing === null) {
            return result_1.Result.fail(new errors_1.NotFoundError('League', input.id.value));
        }
        if (input.name !== undefined) {
            const all = await this.leagueRepository.findAll();
            const nameExists = all.some((l) => l.name.toLowerCase() === input.name.trim().toLowerCase() &&
                !l.id?.equals(input.id));
            if (nameExists) {
                return result_1.Result.fail(new errors_1.AlreadyExistsError('League', `nombre "${input.name}"`));
            }
        }
        const updated = League_entity_1.League.create({
            id: input.id,
            name: input.name?.trim() ?? existing.name,
            leagueCategory: input.leagueCategory ?? existing.leagueCategory,
        });
        await this.leagueRepository.save(updated);
        return result_1.Result.ok(updated);
    }
}
exports.UpdateLeague = UpdateLeague;
