import type { FastifyRequest, FastifyReply } from 'fastify';
import type { IJwtService } from '@/application/ports/auth/JwtService.port';

/**
 * Crea un preHandler que exige JWT válido y adjunta request.user.
 * Si no hay token o es inválido, responde 401.
 */
export function createRequireAuth(jwtService: IJwtService) {
  return async function requireAuth(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.code(401).send({ message: 'Token de autenticación requerido' });
    }
    const token = authHeader.slice(7);
    const payload = await jwtService.verify(token);
    if (payload === null) {
      return reply.code(401).send({ message: 'Token inválido o caducado' });
    }
    request.user = { playerId: payload.sub, role: payload.role };
  };
}

/**
 * Crea un preHandler que exige JWT válido Y role ADMIN.
 * Combina auth + verificación de rol. Si no es ADMIN, responde 403.
 */
export function createRequireAdmin(jwtService: IJwtService) {
  const requireAuth = createRequireAuth(jwtService);
  return async function requireAdmin(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    await requireAuth(request, reply);
    if (reply.sent) return;
    if (request.user?.role !== 'ADMIN') {
      return reply.code(403).send({ message: 'Se requieren permisos de administrador' });
    }
  };
}
