import { describe, it, expect } from 'vitest';
import { TeamSeasonId } from '@/domain/rosters/TeamSeasonId.value-object';

describe('TeamSeasonId', () => {
  it('fromString acepta UUID válido', () => {
    const id = TeamSeasonId.fromString('123e4567-e89b-12d3-a456-426614174000');
    expect(id.value).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('fromString lanza para string vacío', () => {
    expect(() => TeamSeasonId.fromString('')).toThrow('vacío');
    expect(() => TeamSeasonId.fromString('   ')).toThrow('vacío');
  });

  it('fromString lanza para formato no UUID', () => {
    expect(() => TeamSeasonId.fromString('no-es-uuid')).toThrow('inválido');
  });

  it('generate crea id único', () => {
    const id = TeamSeasonId.generate();
    expect(id.value).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('equals compara por valor', () => {
    const a = TeamSeasonId.fromString('123e4567-e89b-12d3-a456-426614174000');
    const b = TeamSeasonId.fromString('123e4567-e89b-12d3-a456-426614174000');
    const c = TeamSeasonId.fromString('123e4567-e89b-12d3-a456-426614174001');
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
