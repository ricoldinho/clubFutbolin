import { describe, it, expect } from 'vitest';
import {
  DomainValidationError,
  NotFoundError,
  InfrastructureError,
} from '@/domain/shared/errors';

describe('DomainValidationError', () => {
  it('crea error con nombre y mensaje', () => {
    const err = new DomainValidationError('Campo inválido');
    expect(err.name).toBe('DomainValidationError');
    expect(err.message).toBe('Campo inválido');
  });
});

describe('NotFoundError', () => {
  it('crea error con entidad y criterio opcional', () => {
    const err = new NotFoundError('Player', 'id-123');
    expect(err.name).toBe('NotFoundError');
    expect(err.message).toContain('Player');
    expect(err.message).toContain('id-123');
  });

  it('crea error solo con entidad cuando no se pasa criterio', () => {
    const err = new NotFoundError('Player');
    expect(err.name).toBe('NotFoundError');
    expect(err.message).toBe('Player no encontrado');
  });
});

describe('InfrastructureError', () => {
  it('crea error con mensaje y cause opcional', () => {
    const cause = new Error('ECONNREFUSED');
    const err = new InfrastructureError('Fallo de conexión', cause);
    expect(err.name).toBe('InfrastructureError');
    expect(err.message).toBe('Fallo de conexión');
    expect(err.cause).toBe(cause);
  });

  it('crea error solo con mensaje cuando no se pasa cause', () => {
    const err = new InfrastructureError('BD no disponible');
    expect(err.name).toBe('InfrastructureError');
    expect(err.message).toBe('BD no disponible');
    expect(err.cause).toBeUndefined();
  });
});
