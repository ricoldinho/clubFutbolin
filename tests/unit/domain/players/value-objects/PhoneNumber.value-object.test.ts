import { describe, it, expect } from 'vitest';
import { PhoneNumber } from '@/domain/players/value-objects/PhoneNumber.value-object';

describe('PhoneNumber', () => {
  it('debe crear un PhoneNumber válido con 9 dígitos', () => {
    // Arrange
    const value = '612345678';

    // Act
    const phone = PhoneNumber.create(value);

    // Assert
    expect(phone.value).toBe('612345678');
  });

  it('debe extraer solo dígitos y aceptar formato con espacios y guiones', () => {
    // Arrange
    const value = '+34 612 345 678';

    // Act
    const phone = PhoneNumber.create(value);

    // Assert
    expect(phone.value).toBe('34612345678');
  });

  it('debe considerar iguales dos PhoneNumbers con los mismos dígitos', () => {
    // Arrange
    const a = PhoneNumber.create('612 345 678');
    const b = PhoneNumber.create('612345678');

    // Act
    const result = a.equals(b);

    // Assert
    expect(result).toBe(true);
  });

  it('debe lanzar si tiene menos de 9 dígitos', () => {
    // Arrange
    const value = '12345';

    // Act & Assert
    expect(() => PhoneNumber.create(value)).toThrow(
      /debe tener al menos 9 dígitos/
    );
  });

  it('debe lanzar si tiene más de 15 dígitos', () => {
    // Arrange
    const value = '1234567890123456';

    // Act & Assert
    expect(() => PhoneNumber.create(value)).toThrow(
      /máximo 15 dígitos/
    );
  });
});
