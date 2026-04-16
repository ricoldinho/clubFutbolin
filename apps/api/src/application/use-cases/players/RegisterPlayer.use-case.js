"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterPlayer = void 0;
const Player_entity_1 = require("@/domain/players/Player.entity");
const PlayerId_value_object_1 = require("@/domain/players/value-objects/PlayerId.value-object");
const PlayerRole_1 = require("@/domain/players/PlayerRole");
const errors_1 = require("@/domain/players/errors");
const result_1 = require("@/shared/result");
/**
 * Registra un nuevo Player con role USER. Garantiza la invariante: un email solo puede pertenecer a un Player.
 * Si el email ya existe, devuelve Result.fail(EmailAlreadyInUseError) (en HTTP → 409 Conflict).
 * La contraseña se hashea antes de persistir; nunca se guarda en claro.
 */
class RegisterPlayer {
    constructor(playerRepository, passwordHasher) {
        this.playerRepository = playerRepository;
        this.passwordHasher = passwordHasher;
    }
    async execute(input) {
        const { password, ...props } = input;
        const existing = await this.playerRepository.findByEmail(props.email);
        if (existing !== null) {
            return result_1.Result.fail(new errors_1.EmailAlreadyInUseError(props.email.value));
        }
        const passwordHash = await this.passwordHasher.hash(password);
        const player = Player_entity_1.Player.create({
            ...props,
            role: PlayerRole_1.PlayerRole.USER,
            id: PlayerId_value_object_1.PlayerId.generate(),
        });
        await this.playerRepository.save(player, passwordHash);
        return result_1.Result.ok(player);
    }
}
exports.RegisterPlayer = RegisterPlayer;
