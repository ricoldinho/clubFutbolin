import { describe, it, expect } from 'vitest';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import { DomainValidationError } from '@/domain/shared/errors';

describe('LeagueId', () => {
  it('fromString acepta UUID válido', () => {
    const id = LeagueId.fromString('123e4567-e89b-12d3-a456-426614174000');
    expect(id.value).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('fromString lanza DomainValidationError para string vacío', () => {
    expect(() => LeagueId.fromString('')).toThrow(DomainValidationError);
  });

  it('generate crea un nuevo UUID', () => {
    const id = LeagueId.generate();
    expect(id.value).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});
