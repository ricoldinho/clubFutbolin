"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateMatchScore = void 0;
const errors_1 = require("@/domain/matches/errors");
const errors_2 = require("@/domain/shared/errors");
const result_1 = require("@/shared/result");
/**
 * Actualiza el marcador de un partido existente.
 * Delega invariantes de negocio al agregado Match.
 * Devuelve Result.fail en:
 * - NotFoundError: partido no encontrado
 * - MatchScoreUpdateNotAllowedError: partido cancelado
 * - InvalidMatchScoreError: score inválido (negativo/no entero)
 */
class UpdateMatchScore {
    constructor(matchRepository) {
        this.matchRepository = matchRepository;
    }
    async execute(input) {
        const match = await this.matchRepository.findById(input.matchId);
        if (match === null) {
            return result_1.Result.fail(new errors_2.NotFoundError('Match', input.matchId.value));
        }
        try {
            const updated = match.updateScore(input.homeScore, input.awayScore);
            await this.matchRepository.save(updated);
            return result_1.Result.ok({ matchId: input.matchId.value });
        }
        catch (error) {
            if (error instanceof errors_1.MatchScoreUpdateNotAllowedError ||
                error instanceof errors_1.InvalidMatchScoreError) {
                return result_1.Result.fail(error);
            }
            throw error;
        }
    }
}
exports.UpdateMatchScore = UpdateMatchScore;
