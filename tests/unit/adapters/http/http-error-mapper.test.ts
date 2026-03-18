import { describe, it, expect } from 'vitest';
import { mapDomainErrorToHttp } from '@/adapters/http/http-error-mapper';
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

describe('mapDomainErrorToHttp', () => {
  it('mapea InvalidCredentialsError a 401 y mensaje del error', () => {
    const err = new InvalidCredentialsError();
    const result = mapDomainErrorToHttp(err);
    expect(result.statusCode).toBe(401);
    expect(result.message).toBe('Credenciales inválidas');
  });

  it('mapea AlreadyExistsError a 409 y mensaje del error', () => {
    const err = new AlreadyExistsError('Team', 'nombre "Equipo A"');
    const result = mapDomainErrorToHttp(err);
    expect(result.statusCode).toBe(409);
    expect(result.message).toContain('Equipo A');
  });

  it('mapea EmailAlreadyInUseError a 409 y mensaje del error', () => {
    const err = new EmailAlreadyInUseError('a@b.com');
    const result = mapDomainErrorToHttp(err);
    expect(result.statusCode).toBe(409);
    expect(result.message).toContain('a@b.com');
  });

  it('mapea DomainValidationError a 400 y mensaje del error', () => {
    const err = new DomainValidationError('Datos inválidos');
    const result = mapDomainErrorToHttp(err);
    expect(result.statusCode).toBe(400);
    expect(result.message).toBe('Datos inválidos');
  });

  it('mapea ForbiddenError a 403 y mensaje del error', () => {
    const err = new ForbiddenError();
    const result = mapDomainErrorToHttp(err);
    expect(result.statusCode).toBe(403);
    expect(result.message).toContain('permiso');
  });

  it('mapea NotFoundError a 404 y mensaje del error', () => {
    const err = new NotFoundError('Player', 'id-123');
    const result = mapDomainErrorToHttp(err);
    expect(result.statusCode).toBe(404);
    expect(result.message).toContain('Player');
    expect(result.message).toContain('id-123');
  });

  it('mapea InfrastructureError a 500 y mensaje genérico', () => {
    const err = new InfrastructureError('BD caída');
    const result = mapDomainErrorToHttp(err);
    expect(result.statusCode).toBe(500);
    expect(result.message).toBe('Error interno del servidor');
  });

  it('mapea error desconocido a 500 y mensaje genérico', () => {
    const result = mapDomainErrorToHttp(new Error('Cualquier error'));
    expect(result.statusCode).toBe(500);
    expect(result.message).toBe('Error interno del servidor');
  });
});
