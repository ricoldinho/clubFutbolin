import { DomainValidationError } from '@/domain/shared/errors';

/**
 * Categorías de liga permitidas.
 */
export const LEAGUE_CATEGORIES = [
  'ELITE',
  'PRO',
  'AVANZADO',
  'MASTER',
  'PRIMERA',
  'SEGUNDA',
  'TERCERA',
  'CUARTA',
] as const;

export type LeagueCategory = (typeof LEAGUE_CATEGORIES)[number];

const VALID_CATEGORIES: Set<string> = new Set(LEAGUE_CATEGORIES);

export function isLeagueCategory(value: string): value is LeagueCategory {
  return VALID_CATEGORIES.has(value);
}

export function parseLeagueCategory(value: string): LeagueCategory {
  if (!isLeagueCategory(value)) {
    throw new DomainValidationError(
      `Categoría de liga inválida: "${value}". Valores permitidos: ${LEAGUE_CATEGORIES.join(', ')}`,
    );
  }
  return value;
}
