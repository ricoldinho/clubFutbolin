import type { IPlayerRepository } from '@/application/ports/players/Player.repository';
import type { IPasswordHasher } from '@/application/ports/auth/PasswordHasher.port';
import type { IJwtService } from '@/application/ports/auth/JwtService.port';
import { Email } from '@/domain/players/value-objects/Email.value-object';
import { InvalidCredentialsError } from '@/domain/players/errors';
import { Result } from '@/shared/result';

export interface LoginPlayerInput {
  email: Email;
  password: string;
}

export interface LoginPlayerOutput {
  token: string;
  expiresIn: string;
}

/**
 * Autentica un Player por email y contraseña. Si son correctos, devuelve un JWT.
 * Si no existe el email o la contraseña no coincide, devuelve InvalidCredentialsError (HTTP 401).
 */
export class LoginPlayer {
  constructor(
    private readonly playerRepository: IPlayerRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly jwtService: IJwtService,
  ) {}

  async execute(
    input: LoginPlayerInput,
  ): Promise<Result<LoginPlayerOutput, InvalidCredentialsError>> {
    const loginData = await this.playerRepository.findLoginDataByEmail(input.email);
    if (loginData === null) {
      return Result.fail(new InvalidCredentialsError());
    }
    const valid = await this.passwordHasher.verify(
      input.password,
      loginData.passwordHash,
    );
    if (!valid) {
      return Result.fail(new InvalidCredentialsError());
    }
    const token = await this.jwtService.sign({
      sub: loginData.playerId.value,
      role: loginData.role,
    });
    return Result.ok({
      token,
      expiresIn: this.jwtService.getExpiresIn(),
    });
  }
}
