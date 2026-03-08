import { describe, it, expect } from 'vitest';
import {
  PlayerCategory,
  isPlayerCategory,
  parsePlayerCategory,
} from '@/modules/players/domain/PlayerCategory';

describe('PlayerCategory', () => {
  it('debe tener los valores CUARTA, TERCERA, SEGUNDA, PRIMERA, ELITE', () => {
    // Assert
    expect(PlayerCategory.CUARTA).toBe('CUARTA');
    expect(PlayerCategory.TERCERA).toBe('TERCERA');
    expect(PlayerCategory.SEGUNDA).toBe('SEGUNDA');
    expect(PlayerCategory.PRIMERA).toBe('PRIMERA');
    expect(PlayerCategory.ELITE).toBe('ELITE');
  });

  it('isPlayerCategory debe devolver true para valores válidos', () => {
    // Act & Assert
    expect(isPlayerCategory('ELITE')).toBe(true);
    expect(isPlayerCategory('PRIMERA')).toBe(true);
  });

  it('isPlayerCategory debe devolver false para valores inválidos', () => {
    // Act & Assert
    expect(isPlayerCategory('juvenil')).toBe(false);
    expect(isPlayerCategory('')).toBe(false);
  });

  it('parsePlayerCategory debe devolver el enum para string válido', () => {
    // Arrange
    const value = 'CUARTA';

    // Act
    const result = parsePlayerCategory(value);

    // Assert
    expect(result).toBe(PlayerCategory.CUARTA);
  });

  it('parsePlayerCategory debe lanzar para string inválido', () => {
    // Arrange
    const value = 'OTRA';

    // Act & Assert
    expect(() => parsePlayerCategory(value)).toThrow(/Categoría inválida/);
  });
});
