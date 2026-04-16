"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePlayer = void 0;
const Player_entity_1 = require("@/domain/players/Player.entity");
const errors_1 = require("@/domain/players/errors");
const errors_2 = require("@/domain/shared/errors");
const PlayerRole_1 = require("@/domain/players/PlayerRole");
const result_1 = require("@/shared/result");
/**
 * Actualiza los datos de un Player existente.
 * Solo el propio Player o un ADMIN pueden actualizar.
 * - Si no existe, devuelve Result.fail(NotFoundError) (HTTP → 404).
 * - Si el actor no tiene permiso (no es el propio jugador ni ADMIN), Result.fail(ForbiddenError) (HTTP → 403).
 * - Si el nuevo email ya está en uso por otro Player, devuelve Result.fail(EmailAlreadyInUseError) (HTTP → 409).
 * - Solo un actor con role ADMIN puede asignar role ADMIN a otro Player; si no, Result.fail(ForbiddenError) (HTTP → 403).
 */
class UpdatePlayer {
    constructor(playerRepository) {
        this.playerRepository = playerRepository;
    }
    async execute(input) {
        const existing = await this.playerRepository.findById(input.id);
        if (existing === null) {
            return result_1.Result.fail(new errors_2.NotFoundError('Player', input.id.value));
        }
        const isSelf = input.actor.id.equals(input.id);
        const isAdmin = input.actor.role === PlayerRole_1.PlayerRole.ADMIN;
        if (!isSelf && !isAdmin) {
            return result_1.Result.fail(new errors_2.ForbiddenError());
        }
        if (input.role !== undefined && input.role === PlayerRole_1.PlayerRole.ADMIN) {
            if (input.actor.role !== PlayerRole_1.PlayerRole.ADMIN) {
                return result_1.Result.fail(new errors_2.ForbiddenError('Solo un administrador puede asignar el rol ADMIN'));
            }
        }
        if (input.email !== undefined) {
            const byEmail = await this.playerRepository.findByEmail(input.email);
            if (byEmail !== null &&
                byEmail.id !== undefined &&
                !byEmail.id.equals(input.id)) {
                return result_1.Result.fail(new errors_1.EmailAlreadyInUseError(input.email.value));
            }
        }
        const updated = Player_entity_1.Player.create({
            id: input.id,
            name: input.name ?? existing.name,
            lastname: input.lastname ?? existing.lastname,
            nickname: input.nickname !== undefined ? input.nickname : existing.nickname,
            email: input.email ?? existing.email,
            phoneNumber: input.phoneNumber ?? existing.phoneNumber,
            birthdate: input.birthdate ?? existing.birthdate,
            category: input.category ?? existing.category,
            role: input.role ?? existing.role,
        });
        await this.playerRepository.save(updated);
        return result_1.Result.ok(updated);
    }
}
exports.UpdatePlayer = UpdatePlayer;
