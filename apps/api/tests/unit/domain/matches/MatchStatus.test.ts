import { describe, expect, it } from 'vitest';
import {
  MatchStatus,
  isMatchStatus,
  parseMatchStatus,
} from '@/domain/matches/MatchStatus';

describe('MatchStatus', () => {
  it('expone los estados válidos del partido', () => {
    // Arrange
    // Estados esperados.

    // Act + Assert
    expect(MatchStatus.SCHEDULED).toBe('SCHEDULED');
    expect(MatchStatus.FINISHED).toBe('FINISHED');
    expect(MatchStatus.POSTPONED).toBe('POSTPONED');
    expect(MatchStatus.CANCELLED).toBe('CANCELLED');
  });

  it('isMatchStatus devuelve true para un estado válido', () => {
    // Arrange
    const status = 'FINISHED';

    // Act
    const isValid = isMatchStatus(status);

    // Assert
    expect(isValid).toBe(true);
  });

  it('parseMatchStatus lanza error para estado inválido', () => {
    // Arrange
    const invalidStatus = 'PLAYING';

    // Act + Assert
    expect(() => parseMatchStatus(invalidStatus)).toThrow(/Estado de partido inválido/);
  });
});
