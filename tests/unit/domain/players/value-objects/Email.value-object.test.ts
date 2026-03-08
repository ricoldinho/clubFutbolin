import { describe, it, expect } from 'vitest';
import { Email } from '@/domain/players/value-objects/Email.value-object';

describe('Email', () => {
  it('debe crear un Email válido', () => {
    // Arrange
    const value = 'user@example.com';

    // Act
    const email = Email.create(value);

    // Assert
    expect(email.value).toBe('user@example.com');
  });

  it('debe normalizar a minúsculas', () => {
    // Arrange
    const value = 'User@Example.COM';

    // Act
    const email = Email.create(value);

    // Assert
    expect(email.value).toBe('user@example.com');
  });

  it('debe considerar iguales dos Emails con el mismo valor', () => {
    // Arrange
    const a = Email.create('a@b.com');
    const b = Email.create('a@b.com');

    // Act
    const result = a.equals(b);

    // Assert
    expect(result).toBe(true);
  });

  it('debe lanzar si el email está vacío', () => {
    // Arrange
    const value = '   ';

    // Act & Assert
    expect(() => Email.create(value)).toThrow('Email no puede estar vacío');
  });

  it('debe lanzar si el formato es inválido', () => {
    // Arrange
    const value = 'not-an-email';

    // Act & Assert
    expect(() => Email.create(value)).toThrow('Formato de email inválido');
  });
});
