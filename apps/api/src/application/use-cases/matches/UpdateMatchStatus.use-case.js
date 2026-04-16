"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateMatchStatus = void 0;
const errors_1 = require("@/domain/shared/errors");
const result_1 = require("@/shared/result");
/**
 * Actualiza el estado de un partido existente.
 * Solo permite transiciones operativas manuales: POSTPONED y CANCELLED.
 */
class UpdateMatchStatus {
    constructor(matchRepository) {
        this.matchRepository = matchRepository;
    }
    async execute(input) {
        const match = await this.matchRepository.findById(input.matchId);
        if (match === null) {
            return result_1.Result.fail(new errors_1.NotFoundError('Match', input.matchId.value));
        }
        const updated = match.updateStatus(input.status);
        await this.matchRepository.save(updated);
        return result_1.Result.ok({ matchId: input.matchId.value });
    }
}
exports.UpdateMatchStatus = UpdateMatchStatus;
