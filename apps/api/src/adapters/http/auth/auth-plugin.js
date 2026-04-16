"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequireAuth = createRequireAuth;
exports.createRequireAdmin = createRequireAdmin;
/**
 * Crea un preHandler que exige JWT válido y adjunta request.user.
 * Si no hay token o es inválido, responde 401.
 */
function createRequireAuth(jwtService) {
    const getBearerToken = (authHeader) => {
        if (!authHeader?.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.slice(7);
    };
    return async function requireAuth(request, reply) {
        const authHeaderToken = getBearerToken(request.headers.authorization);
        const accessCookieName = request.server.config?.AUTH_ACCESS_COOKIE_NAME ?? 'clubfutbolin_at';
        const cookieToken = request.cookies?.[accessCookieName];
        const token = authHeaderToken ?? cookieToken;
        if (!token) {
            return reply.code(401).send({ message: 'Token de autenticación requerido' });
        }
        const payload = await jwtService.verify(token, 'access');
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
function createRequireAdmin(jwtService) {
    const requireAuth = createRequireAuth(jwtService);
    return async function requireAdmin(request, reply) {
        await requireAuth(request, reply);
        if (reply.sent)
            return;
        if (request.user?.role !== 'ADMIN') {
            return reply.code(403).send({ message: 'Se requieren permisos de administrador' });
        }
    };
}
