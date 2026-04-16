"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddPlayerToRoster = void 0;
const errors_1 = require("@/domain/shared/errors");
const result_1 = require("@/shared/result");
/**
 * Añade un jugador a la plantilla. Valida max 4 y sin duplicados.
 */
class AddPlayerToRoster {
    constructor(rosterRepository) {
        this.rosterRepository = rosterRepository;
    }
    async execute(input) {
        const roster = await this.rosterRepository.findById(input.teamSeasonId);
        if (roster === null) {
            return result_1.Result.fail(new errors_1.NotFoundError('TeamSeason', input.teamSeasonId.value));
        }
        try {
            const updated = roster.addPlayer(input.playerId, input.position);
            await this.rosterRepository.saveRoster(updated);
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
exports.AddPlayerToRoster = AddPlayerToRoster;
