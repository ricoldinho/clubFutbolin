import { describe, expect, it } from 'vitest';
import { MatchScore } from '@/domain/matches/MatchScore.value-object';
import { InvalidMatchScoreError } from '@/domain/matches/errors';

describe('MatchScore', () => {
  it('crea marcador pendiente con ambos valores en null', () => {
    // Arrange
    // Sin datos de marcador.

    // Act
    const score = MatchScore.pending();

    // Assert
    expect(score.home).toBeNull();
    expect(score.away).toBeNull();
    expect(score.hasResult()).toBe(false);
  });

  it('lanza error si solo uno de los valores es null', () => {
    // Arrange
    const homeScore = 1;
    const awayScore = null;

    // Act + Assert
    expect(() => MatchScore.fromNullable(homeScore, awayScore)).toThrow(
      InvalidMatchScoreError,
    );
  });

  it('lanza error si el marcador es negativo', () => {
    // Arrange
    const homeScore = -1;
    const awayScore = 2;

    // Act + Assert
    expect(() => MatchScore.fromResult(homeScore, awayScore)).toThrow(
      InvalidMatchScoreError,
    );
  });
});
