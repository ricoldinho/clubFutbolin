import { v7 } from 'uuid';
import { DomainValidationError } from '@/domain/shared/errors';

/**
 * Identificador único del Player. UUID (recomendado v7) compatible con PostgreSQL uuid.
 * - v7: ordenado en el tiempo, mejor para índices B-tree.
 * - Se genera en aplicación para poder crear la entidad antes de persistir.
 */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class PlayerId {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value.toLowerCase();
  }

  static fromString(value: string): PlayerId {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new DomainValidationError('PlayerId no puede estar vacío');
    }
    if (!UUID_REGEX.test(trimmed)) {
      throw new DomainValidationError(
        `Formato de PlayerId inválido (se espera UUID): ${value}`,
      );
    }
    return new PlayerId(trimmed);
  }

  static generate(): PlayerId {
    return new PlayerId(v7());
  }

  get value(): string {
    return this._value;
  }

  equals(other: PlayerId): boolean {
    return this._value === other._value;
  }
}
