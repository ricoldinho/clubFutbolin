import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { IPlayerRepository } from '@/application/ports/players/Player.repository';
import type { IPasswordHasher } from '@/application/ports/auth/PasswordHasher.port';
import type { IJwtService } from '@/application/ports/auth/JwtService.port';
import { LoginPlayer } from '@/application/use-cases/players/LoginPlayer.use-case';
import { Email } from '@/domain/players/value-objects/Email.value-object';
import { mapDomainErrorToHttp } from '@/adapters/http/http-error-mapper';
import { loginBodySchema, type LoginBody } from '@/adapters/http/players/schemas';

interface AuthRoutesOptions extends FastifyPluginOptions {
  repository: IPlayerRepository;
  passwordHasher: IPasswordHasher;
  jwtService: IJwtService;
}

/**
 * POST /auth/login
 * Body: { email, password }. Responde 200 con { token, expiresIn } o 401.
 */
export async function authRoutes(
  server: FastifyInstance,
  options: AuthRoutesOptions,
): Promise<void> {
  const zodServer = server.withTypeProvider<ZodTypeProvider>();
  const loginPlayer = new LoginPlayer(
    options.repository,
    options.passwordHasher,
    options.jwtService,
  );

  zodServer.post(
    '/auth/login',
    {
      schema: {
        body: loginBodySchema,
      },
    },
    async (request, reply) => {
      try {
        const body = request.body as LoginBody;
        const result = await loginPlayer.execute({
          email: Email.create(body.email),
          password: body.password,
        });

        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          return reply.code(statusCode).send({ message });
        }

        return reply.code(200).send(result.value);
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        if (statusCode >= 500) {
          request.log.error({ err: error }, 'Error inesperado en login');
        }
        return reply.code(statusCode).send({ message });
      }
    },
  );
}
