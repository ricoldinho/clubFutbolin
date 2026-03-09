import { DomainValidationError } from '@/domain/shared/errors';

/**
 * Value Object para fecha de nacimiento.
 * Valida que la fecha sea válida y que no sea futura (Fail Fast).
 */
export class Birthdate {
  private readonly _value: Date;

  private constructor(value: Date) {
    this._value = value;
  }

  static create(value: Date | string): Birthdate {
    const date = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) {
      throw new DomainValidationError(`Fecha inválida: ${value}`);
    }
    const now = new Date();
    if (date > now) {
      throw new DomainValidationError('La fecha de nacimiento no puede ser futura');
    }
    return new Birthdate(date);
  }

  get value(): Date {
    return this._value;
  }

  equals(other: Birthdate): boolean {
    return this._value.getTime() === other._value.getTime();
  }
}
