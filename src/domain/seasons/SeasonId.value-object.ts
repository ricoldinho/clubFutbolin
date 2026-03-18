import { v7 } from 'uuid';
import { DomainValidationError } from '@/domain/shared/errors';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class SeasonId {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value.toLowerCase();
  }

  static fromString(value: string): SeasonId {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new DomainValidationError('SeasonId no puede estar vacío');
    }
    if (!UUID_REGEX.test(trimmed)) {
      throw new DomainValidationError(
        `Formato de SeasonId inválido (se espera UUID): ${value}`,
      );
    }
    return new SeasonId(trimmed);
  }

  static generate(): SeasonId {
    return new SeasonId(v7());
  }

  get value(): string {
    return this._value;
  }

  equals(other: SeasonId): boolean {
    return this._value === other._value;
  }
}
