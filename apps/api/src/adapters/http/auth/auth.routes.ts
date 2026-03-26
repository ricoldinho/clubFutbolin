import type { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { IPlayerRepository } from '@/application/ports/players/Player.repository';
import type { IPasswordHasher } from '@/application/ports/auth/PasswordHasher.port';
import type { IJwtService } from '@/application/ports/auth/JwtService.port';
import { LoginPlayer } from '@/application/use-cases/players/LoginPlayer.use-case';
import { Email } from '@/domain/players/value-objects/Email.value-object';
import { mapDomainErrorToHttp } from '@/adapters/http/http-error-mapper';
import {
  loginBodySchema,
  loginResponseSchema,
  type LoginBody,
} from '@/adapters/http/players/schemas';
import { httpErrorResponseSchema } from '@/adapters/http/http-response-schemas';

interface AuthRoutesOptions extends FastifyPluginOptions {
  repository?: IPlayerRepository;
  passwordHasher?: IPasswordHasher;
  jwtService?: IJwtService;
  loginPlayer?: LoginPlayer;
}

/**
 * POST /auth/login
 * Body: { email, password }. Responde 200 con { token, expiresIn } o 401.
 */
export async function authRoutes(
  server: FastifyInstance,
  options: AuthRoutesOptions = {},
): Promise<void> {
  const zodServer = server.withTypeProvider<ZodTypeProvider>();
  const resolveLoginPlayer = (request: FastifyRequest) =>
    options.loginPlayer ??
    (options.repository && options.passwordHasher && options.jwtService
      ? new LoginPlayer(options.repository, options.passwordHasher, options.jwtService)
      : request.container.cradle.loginPlayer);

  zodServer.post(
    '/auth/login',
    {
      schema: {
        body: loginBodySchema,
        response: {
          200: loginResponseSchema,
          400: httpErrorResponseSchema,
          401: httpErrorResponseSchema,
          500: httpErrorResponseSchema,
        },
        tags: ['auth'],
        summary: 'Login de player',
      },
    },
    async (request, reply) => {
      try {
        const loginPlayer = resolveLoginPlayer(request);
        const body = request.body as LoginBody;
        const result = await loginPlayer.execute({
          email: Email.create(body.email),
          password: body.password,
        });

        if (!result.ok) {
          const { statusCode, message } = mapDomainErrorToHttp(result.error);
          return reply
            .code(statusCode as 200 | 400 | 401 | 500)
            .send({ message });
        }

        return reply.code(200).send(result.value);
      } catch (error) {
        const { statusCode, message } = mapDomainErrorToHttp(error);
        if (statusCode >= 500) {
          request.log.error({ err: error }, 'Error inesperado en login');
        }
        return reply
          .code(statusCode as 200 | 400 | 401 | 500)
          .send({ message });
      }
    },
  );
}
