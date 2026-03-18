import { DomainValidationError } from '@/domain/shared/errors';

export const POSITIONS = ['PORTERO', 'DELANTERO'] as const;
export type Position = (typeof POSITIONS)[number];

const VALID_POSITIONS = new Set<string>(POSITIONS);

export function isPosition(value: string): value is Position {
  return VALID_POSITIONS.has(value);
}

export function parsePosition(value: string): Position {
  if (!isPosition(value)) {
    throw new DomainValidationError(
      `Posición inválida: "${value}". Valores: ${POSITIONS.join(', ')}`,
    );
  }
  return value;
}
