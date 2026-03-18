import { v7 } from 'uuid';
import { DomainValidationError } from '@/domain/shared/errors';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class LeagueId {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value.toLowerCase();
  }

  static fromString(value: string): LeagueId {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new DomainValidationError('LeagueId no puede estar vacío');
    }
    if (!UUID_REGEX.test(trimmed)) {
      throw new DomainValidationError(
        `Formato de LeagueId inválido (se espera UUID): ${value}`,
      );
    }
    return new LeagueId(trimmed);
  }

  static generate(): LeagueId {
    return new LeagueId(v7());
  }

  get value(): string {
    return this._value;
  }

  equals(other: LeagueId): boolean {
    return this._value === other._value;
  }
}
