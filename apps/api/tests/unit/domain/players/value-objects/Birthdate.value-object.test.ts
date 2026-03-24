import { describe, it, expect } from 'vitest';
import { Birthdate } from '@/domain/players/value-objects/Birthdate.value-object';

describe('Birthdate', () => {
  it('debe crear una Birthdate válida desde Date', () => {
    // Arrange
    const value = new Date('2005-03-15');

    // Act
    const birthdate = Birthdate.create(value);

    // Assert
    expect(birthdate.value).toEqual(new Date('2005-03-15'));
  });

  it('debe crear una Birthdate válida desde string ISO', () => {
    // Arrange
    const value = '2000-01-01';

    // Act
    const birthdate = Birthdate.create(value);

    // Assert
    expect(birthdate.value).toEqual(new Date('2000-01-01'));
  });

  it('debe considerar iguales dos Birthdates con la misma fecha', () => {
    // Arrange
    const a = Birthdate.create('1990-05-20');
    const b = Birthdate.create(new Date('1990-05-20'));

    // Act
    const result = a.equals(b);

    // Assert
    expect(result).toBe(true);
  });

  it('debe lanzar si la fecha es inválida', () => {
    // Arrange
    const value = 'no-es-una-fecha';

    // Act & Assert
    expect(() => Birthdate.create(value)).toThrow(/Fecha inválida/);
  });

  it('debe lanzar si la fecha es futura', () => {
    // Arrange
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);

    // Act & Assert
    expect(() => Birthdate.create(future)).toThrow(
      /La fecha de nacimiento no puede ser futura/
    );
  });
});
