export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  FINISHED = 'FINISHED',
  POSTPONED = 'POSTPONED',
  CANCELLED = 'CANCELLED',
}

const VALID_MATCH_STATUSES: string[] = Object.values(MatchStatus);

export function isMatchStatus(value: string): value is MatchStatus {
  return VALID_MATCH_STATUSES.includes(value);
}

export function parseMatchStatus(value: string): MatchStatus {
  if (!isMatchStatus(value)) {
    throw new Error(
      `Estado de partido inválido: ${value}. Debe ser uno de: ${VALID_MATCH_STATUSES.join(', ')}`,
    );
  }
  return value as MatchStatus;
}
