import {
  AlreadyExistsError,
  DomainValidationError,
  NotFoundError,
  ForbiddenError,
  InfrastructureError,
} from '@/domain/shared/errors';
import {
  EmailAlreadyInUseError,
  InvalidCredentialsError,
} from '@/domain/players/errors';
import {
  InsufficientTeamsForCalendarError,
  InvalidMatchScoreError,
  MatchScoreUpdateNotAllowedError,
  MatchTeamsMustBeDifferentError,
  SeasonCalendarAlreadyGeneratedError,
} from '@/domain/matches/errors';

/**
 * Resultado del mapeo de un error de dominio/inesperado a respuesta HTTP.
 * Usar en los handlers para no duplicar lógica de if (error instanceof ...).
 */
export interface HttpErrorMapping {
  statusCode: number;
  message: string;
}

/**
 * Mapea un error (dominio o inesperado) a código HTTP y mensaje.
 * Añade aquí los nuevos errores de dominio según la taxonomía del proyecto.
 */
export function mapDomainErrorToHttp(error: unknown): HttpErrorMapping {
  if (error instanceof InvalidCredentialsError) {
    return { statusCode: 401, message: error.message };
  }

  if (error instanceof EmailAlreadyInUseError) {
    return { statusCode: 409, message: error.message };
  }

  if (error instanceof AlreadyExistsError) {
    return { statusCode: 409, message: error.message };
  }

  if (error instanceof ForbiddenError) {
    return { statusCode: 403, message: error.message };
  }

  if (error instanceof SeasonCalendarAlreadyGeneratedError) {
    return { statusCode: 409, message: error.message };
  }

  if (error instanceof InsufficientTeamsForCalendarError) {
    return { statusCode: 400, message: error.message };
  }

  if (
    error instanceof MatchScoreUpdateNotAllowedError ||
    error instanceof InvalidMatchScoreError ||
    error instanceof MatchTeamsMustBeDifferentError
  ) {
    return { statusCode: 400, message: error.message };
  }

  if (error instanceof DomainValidationError) {
    return { statusCode: 400, message: error.message };
  }

  if (error instanceof NotFoundError) {
    return { statusCode: 404, message: error.message };
  }

  if (error instanceof InfrastructureError) {
    return { statusCode: 500, message: 'Error interno del servidor' };
  }

  return { statusCode: 500, message: 'Error interno del servidor' };
}
