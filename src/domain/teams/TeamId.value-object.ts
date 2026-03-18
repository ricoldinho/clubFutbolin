import { v7 } from 'uuid';
import { DomainValidationError } from '@/domain/shared/errors';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class TeamId {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value.toLowerCase();
  }

  static fromString(value: string): TeamId {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new DomainValidationError('TeamId no puede estar vacío');
    }
    if (!UUID_REGEX.test(trimmed)) {
      throw new DomainValidationError(
        `Formato de TeamId inválido (se espera UUID): ${value}`,
      );
    }
    return new TeamId(trimmed);
  }

  static generate(): TeamId {
    return new TeamId(v7());
  }

  get value(): string {
    return this._value;
  }

  equals(other: TeamId): boolean {
    return this._value === other._value;
  }
}
