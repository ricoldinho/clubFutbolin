/**
 * Patrón Result<T, E>: modela éxito (ok) o fallo (err) sin lanzar excepciones.
 * Los casos de uso devuelven Result; la capa HTTP traduce Result.err a códigos de estado.
 *
 * - Result.ok(value) → éxito
 * - Result.fail(error) → fallo de dominio (ej. EmailAlreadyInUseError, NotFoundError)
 * - Errores realmente excepcionales (infra) pueden seguir lanzándose y capturarse en HTTP.
 */

export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const Result = {
  ok<T>(value: T): Result<T, never> {
    return { ok: true, value };
  },

  fail<E>(error: E): Result<never, E> {
    return { ok: false, error };
  },
} as const;

/** Type guard: comprueba si el Result es éxito. */
export function isOk<T, E>(r: Result<T, E>): r is { ok: true; value: T } {
  return r.ok === true;
}

/** Type guard: comprueba si el Result es fallo. */
export function isFail<T, E>(r: Result<T, E>): r is { ok: false; error: E } {
  return r.ok === false;
}
