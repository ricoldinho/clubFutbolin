"use strict";
/**
 * Patrón Result<T, E>: modela éxito (ok) o fallo (err) sin lanzar excepciones.
 * Los casos de uso devuelven Result; la capa HTTP traduce Result.err a códigos de estado.
 *
 * - Result.ok(value) → éxito
 * - Result.fail(error) → fallo de dominio (ej. EmailAlreadyInUseError, NotFoundError)
 * - Errores realmente excepcionales (infra) pueden seguir lanzándose y capturarse en HTTP.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Result = void 0;
exports.isOk = isOk;
exports.isFail = isFail;
exports.Result = {
    ok(value) {
        return { ok: true, value };
    },
    fail(error) {
        return { ok: false, error };
    },
};
/** Type guard: comprueba si el Result es éxito. */
function isOk(r) {
    return r.ok === true;
}
/** Type guard: comprueba si el Result es fallo. */
function isFail(r) {
    return r.ok === false;
}
