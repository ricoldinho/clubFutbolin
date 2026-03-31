import { InvalidMatchScoreError } from './errors';

export class MatchScore {
  private readonly _home: number | null;
  private readonly _away: number | null;

  private constructor(home: number | null, away: number | null) {
    this._home = home;
    this._away = away;
  }

  static pending(): MatchScore {
    return new MatchScore(null, null);
  }

  static fromNullable(home: number | null, away: number | null): MatchScore {
    if ((home === null) !== (away === null)) {
      throw new InvalidMatchScoreError(
        'El marcador debe tener ambos valores o ambos en null',
      );
    }

    if (home === null && away === null) {
      return MatchScore.pending();
    }

    MatchScore.validateScore(home);
    MatchScore.validateScore(away);

    return new MatchScore(home, away);
  }

  static fromResult(home: number, away: number): MatchScore {
    MatchScore.validateScore(home);
    MatchScore.validateScore(away);
    return new MatchScore(home, away);
  }

  get home(): number | null {
    return this._home;
  }

  get away(): number | null {
    return this._away;
  }

  hasResult(): boolean {
    return this._home !== null && this._away !== null;
  }

  private static validateScore(score: number): void {
    if (!Number.isInteger(score)) {
      throw new InvalidMatchScoreError('El marcador debe ser un entero');
    }
    if (score < 0) {
      throw new InvalidMatchScoreError('El marcador no puede ser negativo');
    }
  }
}
