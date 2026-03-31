import { describe, expect, it } from 'vitest';
import { MatchId } from '@/domain/matches/MatchId.value-object';
import { DomainValidationError } from '@/domain/shared/errors';

describe('MatchId', () => {
  it('genera un UUID válido', () => {
    // Arrange
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // Act
    const matchId = MatchId.generate();

    // Assert
    expect(uuidRegex.test(matchId.value)).toBe(true);
  });

  it('lanza error cuando el valor está vacío', () => {
    // Arrange
    const rawMatchId = '   ';

    // Act + Assert
    expect(() => MatchId.fromString(rawMatchId)).toThrow(DomainValidationError);
  });
});
