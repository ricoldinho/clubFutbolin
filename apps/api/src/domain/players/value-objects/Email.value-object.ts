import { DomainValidationError } from '@/domain/shared/errors';

/**
 * Value Object para email. Valida formato en creación (Fail Fast).
 */
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export class Email {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value.trim().toLowerCase();
  }

  static create(value: string): Email {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new DomainValidationError('Email no puede estar vacío');
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      throw new DomainValidationError(`Formato de email inválido: ${value}`);
    }
    return new Email(trimmed);
  }

  get value(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }
}
