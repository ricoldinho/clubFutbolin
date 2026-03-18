import { describe, it, expect } from 'vitest';
import {
  isLeagueCategory,
  parseLeagueCategory,
  LEAGUE_CATEGORIES,
} from '@/domain/leagues/LeagueCategory';
import { DomainValidationError } from '@/domain/shared/errors';

describe('LeagueCategory', () => {
  it('isLeagueCategory devuelve true para valores válidos', () => {
    expect(isLeagueCategory('ELITE')).toBe(true);
    expect(isLeagueCategory('PRIMERA')).toBe(true);
    expect(isLeagueCategory('CUARTA')).toBe(true);
  });

  it('isLeagueCategory devuelve false para valores inválidos', () => {
    expect(isLeagueCategory('INVALID')).toBe(false);
    expect(isLeagueCategory('')).toBe(false);
  });

  it('parseLeagueCategory devuelve el valor para categorías válidas', () => {
    expect(parseLeagueCategory('PRO')).toBe('PRO');
    expect(parseLeagueCategory('AVANZADO')).toBe('AVANZADO');
  });

  it('parseLeagueCategory lanza DomainValidationError para valores inválidos', () => {
    expect(() => parseLeagueCategory('XXX')).toThrow(DomainValidationError);
    expect(() => parseLeagueCategory('XXX')).toThrow('Categoría de liga inválida');
  });

  it('LEAGUE_CATEGORIES contiene las 8 categorías', () => {
    expect(LEAGUE_CATEGORIES).toContain('ELITE');
    expect(LEAGUE_CATEGORIES).toContain('PRO');
    expect(LEAGUE_CATEGORIES).toHaveLength(8);
  });
});
