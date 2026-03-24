import { describe, it, expect } from 'vitest';
import { League } from '@/domain/leagues/League.entity';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';

describe('League', () => {
  it('crea una liga con name y leagueCategory', () => {
    const league = League.create({ name: 'Liga Test', leagueCategory: 'PRIMERA' });
    expect(league.name).toBe('Liga Test');
    expect(league.leagueCategory).toBe('PRIMERA');
    expect(league.id).toBeUndefined();
  });

  it('crea una liga con id cuando se pasa', () => {
    const id = LeagueId.fromString('123e4567-e89b-12d3-a456-426614174000');
    const league = League.create({ id, name: 'Liga Con Id', leagueCategory: 'ELITE' });
    expect(league.id).toBeDefined();
    expect(league.id?.value).toBe('123e4567-e89b-12d3-a456-426614174000');
  });
});
