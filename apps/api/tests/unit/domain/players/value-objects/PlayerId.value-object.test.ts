import { describe, it, expect } from 'vitest';
import { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';

describe('PlayerId', () => {
  it('debe crear un PlayerId desde un UUID válido', () => {
    // Arrange
    const value = '550e8400-e29b-41d4-a716-446655440000';

    // Act
    const id = PlayerId.fromString(value);

    // Assert
    expect(id.value).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('debe normalizar a minúsculas', () => {
    // Arrange
    const value = '550E8400-E29B-41D4-A716-446655440000';

    // Act
    const id = PlayerId.fromString(value);

    // Assert
    expect(id.value).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('debe generar un PlayerId nuevo con generate()', () => {
    // Act
    const id = PlayerId.generate();

    // Assert
    expect(id.value).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  it('debe considerar iguales dos PlayerIds con el mismo valor', () => {
    // Arrange
    const a = PlayerId.fromString('550e8400-e29b-41d4-a716-446655440000');
    const b = PlayerId.fromString('550e8400-e29b-41d4-a716-446655440000');

    // Act
    const result = a.equals(b);

    // Assert
    expect(result).toBe(true);
  });

  it('debe lanzar si el valor está vacío', () => {
    // Act & Assert
    expect(() => PlayerId.fromString('   ')).toThrow(
      'PlayerId no puede estar vacío'
    );
  });

  it('debe lanzar si el formato no es UUID', () => {
    // Act & Assert
    expect(() => PlayerId.fromString('not-a-uuid')).toThrow(
      /Formato de PlayerId inválido/
    );
  });
});
