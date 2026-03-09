/**
 * Value Object para número de teléfono. Acepta dígitos, opcionalmente + al inicio.
 * Longitud típica: 9–15 dígitos (E.164 permite hasta 15).
 */
const MIN_DIGITS = 9;
const MAX_DIGITS = 15;

function extractDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export class PhoneNumber {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): PhoneNumber {
    const digits = extractDigits(value);
    if (digits.length < MIN_DIGITS) {
      throw new Error(
        `Número de teléfono inválido: debe tener al menos ${MIN_DIGITS} dígitos (recibidos: ${digits.length})`
      );
    }
    if (digits.length > MAX_DIGITS) {
      throw new Error(
        `Número de teléfono inválido: máximo ${MAX_DIGITS} dígitos (recibidos: ${digits.length})`
      );
    }
    return new PhoneNumber(digits);
  }

  get value(): string {
    return this._value;
  }

  equals(other: PhoneNumber): boolean {
    return this._value === other._value;
  }
}
