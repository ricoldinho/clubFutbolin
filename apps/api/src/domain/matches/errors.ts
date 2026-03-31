export class MatchTeamsMustBeDifferentError extends Error {
  constructor() {
    super('El equipo local y visitante deben ser diferentes');
    this.name = 'MatchTeamsMustBeDifferentError';
    Object.setPrototypeOf(this, MatchTeamsMustBeDifferentError.prototype);
  }
}

export class InvalidMatchScoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidMatchScoreError';
    Object.setPrototypeOf(this, InvalidMatchScoreError.prototype);
  }
}

export class MatchScoreUpdateNotAllowedError extends Error {
  constructor() {
    super('No se puede actualizar el marcador de un partido cancelado');
    this.name = 'MatchScoreUpdateNotAllowedError';
    Object.setPrototypeOf(this, MatchScoreUpdateNotAllowedError.prototype);
  }
}

export class InsufficientTeamsForCalendarError extends Error {
  constructor() {
    super('No hay suficientes equipos inscritos para generar calendario');
    this.name = 'InsufficientTeamsForCalendarError';
    Object.setPrototypeOf(this, InsufficientTeamsForCalendarError.prototype);
  }
}

export class SeasonCalendarAlreadyGeneratedError extends Error {
  constructor() {
    super('La temporada ya tiene partidos generados');
    this.name = 'SeasonCalendarAlreadyGeneratedError';
    Object.setPrototypeOf(this, SeasonCalendarAlreadyGeneratedError.prototype);
  }
}
