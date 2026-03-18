import { describe, it, expect } from 'vitest';
import { TeamId } from '@/domain/teams/TeamId.value-object';
import { DomainValidationError } from '@/domain/shared/errors';

describe('TeamId', () => {
  it('fromString acepta UUID válido', () => {
    const id = TeamId.fromString('123e4567-e89b-12d3-a456-426614174000');
    expect(id.value).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('fromString lanza DomainValidationError para string vacío', () => {
    expect(() => TeamId.fromString('')).toThrow(DomainValidationError);
  });

  it('fromString lanza DomainValidationError para formato inválido', () => {
    expect(() => TeamId.fromString('not-a-uuid')).toThrow(DomainValidationError);
  });

  it('generate crea un nuevo UUID', () => {
    const id = TeamId.generate();
    expect(id.value).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('equals devuelve true para el mismo valor', () => {
    const id1 = TeamId.fromString('123e4567-e89b-12d3-a456-426614174000');
    const id2 = TeamId.fromString('123e4567-e89b-12d3-a456-426614174000');
    expect(id1.equals(id2)).toBe(true);
  });
});
