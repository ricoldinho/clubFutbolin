"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginPlayer = void 0;
const errors_1 = require("@/domain/players/errors");
const result_1 = require("@/shared/result");
/**
 * Autentica un Player por email y contraseña. Si son correctos, devuelve un JWT.
 * Si no existe el email o la contraseña no coincide, devuelve InvalidCredentialsError (HTTP 401).
 */
class LoginPlayer {
    constructor(playerRepository, passwordHasher, jwtService) {
        this.playerRepository = playerRepository;
        this.passwordHasher = passwordHasher;
        this.jwtService = jwtService;
    }
    async execute(input) {
        const loginData = await this.playerRepository.findLoginDataByEmail(input.email);
        if (loginData === null) {
            return result_1.Result.fail(new errors_1.InvalidCredentialsError());
        }
        const valid = await this.passwordHasher.verify(input.password, loginData.passwordHash);
        if (!valid) {
            return result_1.Result.fail(new errors_1.InvalidCredentialsError());
        }
        const token = await this.jwtService.sign({
            sub: loginData.playerId.value,
            role: loginData.role,
            tokenType: 'access',
        });
        return result_1.Result.ok({
            token,
            playerId: loginData.playerId.value,
            role: loginData.role,
            expiresIn: this.jwtService.getExpiresIn(),
        });
    }
}
exports.LoginPlayer = LoginPlayer;
