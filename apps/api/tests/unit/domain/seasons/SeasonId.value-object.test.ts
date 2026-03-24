import { describe, it, expect } from 'vitest';
import { SeasonId } from '@/domain/seasons/SeasonId.value-object';

describe('SeasonId', () => {
  it('fromString acepta UUID válido', () => {
    const id = SeasonId.fromString('123e4567-e89b-12d3-a456-426614174000');
    expect(id.value).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('fromString lanza para string vacío', () => {
    expect(() => SeasonId.fromString('')).toThrow('vacío');
    expect(() => SeasonId.fromString('   ')).toThrow('vacío');
  });

  it('fromString lanza para formato no UUID', () => {
    expect(() => SeasonId.fromString('no-es-uuid')).toThrow('inválido');
  });

  it('generate crea id único', () => {
    const id = SeasonId.generate();
    expect(id.value).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('equals compara por valor', () => {
    const a = SeasonId.fromString('123e4567-e89b-12d3-a456-426614174000');
    const b = SeasonId.fromString('123e4567-e89b-12d3-a456-426614174000');
    const c = SeasonId.fromString('123e4567-e89b-12d3-a456-426614174001');
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
