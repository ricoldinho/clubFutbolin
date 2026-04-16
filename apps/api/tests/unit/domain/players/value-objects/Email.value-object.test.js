"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const Email_value_object_1 = require("@/domain/players/value-objects/Email.value-object");
(0, vitest_1.describe)('Email', () => {
    (0, vitest_1.it)('debe crear un Email válido', () => {
        // Arrange
        const value = 'user@example.com';
        // Act
        const email = Email_value_object_1.Email.create(value);
        // Assert
        (0, vitest_1.expect)(email.value).toBe('user@example.com');
    });
    (0, vitest_1.it)('debe normalizar a minúsculas', () => {
        // Arrange
        const value = 'User@Example.COM';
        // Act
        const email = Email_value_object_1.Email.create(value);
        // Assert
        (0, vitest_1.expect)(email.value).toBe('user@example.com');
    });
    (0, vitest_1.it)('debe considerar iguales dos Emails con el mismo valor', () => {
        // Arrange
        const a = Email_value_object_1.Email.create('a@b.com');
        const b = Email_value_object_1.Email.create('a@b.com');
        // Act
        const result = a.equals(b);
        // Assert
        (0, vitest_1.expect)(result).toBe(true);
    });
    (0, vitest_1.it)('debe lanzar si el email está vacío', () => {
        // Arrange
        const value = '   ';
        // Act & Assert
        (0, vitest_1.expect)(() => Email_value_object_1.Email.create(value)).toThrow('Email no puede estar vacío');
    });
    (0, vitest_1.it)('debe lanzar si el formato es inválido', () => {
        // Arrange
        const value = 'not-an-email';
        // Act & Assert
        (0, vitest_1.expect)(() => Email_value_object_1.Email.create(value)).toThrow('Formato de email inválido');
    });
});
