import { describe, it, expect } from 'vitest';
import { isPosition, parsePosition, POSITIONS } from '@/domain/rosters/Position';

describe('Position', () => {
  it('isPosition retorna true para PORTERO y DELANTERO', () => {
    expect(isPosition('PORTERO')).toBe(true);
    expect(isPosition('DELANTERO')).toBe(true);
  });

  it('isPosition retorna false para valores inválidos', () => {
    expect(isPosition('DEFENSA')).toBe(false);
    expect(isPosition('')).toBe(false);
    expect(isPosition('portero')).toBe(false);
  });

  it('parsePosition retorna el valor cuando es válido', () => {
    expect(parsePosition('PORTERO')).toBe('PORTERO');
    expect(parsePosition('DELANTERO')).toBe('DELANTERO');
  });

  it('parsePosition lanza para valores inválidos', () => {
    expect(() => parsePosition('CENTRO')).toThrow('Posición inválida');
    expect(() => parsePosition('CENTRO')).toThrow('PORTERO');
    expect(() => parsePosition('CENTRO')).toThrow('DELANTERO');
  });

  it('POSITIONS contiene los valores esperados', () => {
    expect(POSITIONS).toEqual(['PORTERO', 'DELANTERO']);
  });
});
