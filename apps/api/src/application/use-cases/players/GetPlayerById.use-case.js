"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPlayerById = void 0;
const PlayerRole_1 = require("@/domain/players/PlayerRole");
const errors_1 = require("@/domain/shared/errors");
const result_1 = require("@/shared/result");
/**
 * Obtiene un Player por su identificador.
 * Solo el propio Player o un ADMIN pueden ver cualquier jugador.
 * Si no existe, devuelve Result.fail(NotFoundError) (HTTP → 404).
 * Si el actor no tiene permiso, Result.fail(ForbiddenError) (HTTP → 403).
 */
class GetPlayerById {
    constructor(playerRepository) {
        this.playerRepository = playerRepository;
    }
    async execute(id, actor) {
        const player = await this.playerRepository.findById(id);
        if (player === null) {
            return result_1.Result.fail(new errors_1.NotFoundError('Player', id.value));
        }
        const isSelf = actor.id.equals(id);
        const isAdmin = actor.role === PlayerRole_1.PlayerRole.ADMIN;
        if (!isSelf && !isAdmin) {
            return result_1.Result.fail(new errors_1.ForbiddenError());
        }
        return result_1.Result.ok(player);
    }
}
exports.GetPlayerById = GetPlayerById;
