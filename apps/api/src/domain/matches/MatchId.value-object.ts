import { v7 } from 'uuid';
import { DomainValidationError } from '@/domain/shared/errors';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class MatchId {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value.toLowerCase();
  }

  static fromString(value: string): MatchId {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new DomainValidationError('MatchId no puede estar vacío');
    }
    if (!UUID_REGEX.test(trimmed)) {
      throw new DomainValidationError(
        `Formato de MatchId inválido (se espera UUID): ${value}`,
      );
    }
    return new MatchId(trimmed);
  }

  static generate(): MatchId {
    return new MatchId(v7());
  }

  get value(): string {
    return this._value;
  }

  equals(other: MatchId): boolean {
    return this._value === other._value;
  }
}
