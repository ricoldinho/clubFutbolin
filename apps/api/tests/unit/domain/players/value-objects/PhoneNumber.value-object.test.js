"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const PhoneNumber_value_object_1 = require("@/domain/players/value-objects/PhoneNumber.value-object");
(0, vitest_1.describe)('PhoneNumber', () => {
    (0, vitest_1.it)('debe crear un PhoneNumber válido con 9 dígitos', () => {
        // Arrange
        const value = '612345678';
        // Act
        const phone = PhoneNumber_value_object_1.PhoneNumber.create(value);
        // Assert
        (0, vitest_1.expect)(phone.value).toBe('612345678');
    });
    (0, vitest_1.it)('debe extraer solo dígitos y aceptar formato con espacios y guiones', () => {
        // Arrange
        const value = '+34 612 345 678';
        // Act
        const phone = PhoneNumber_value_object_1.PhoneNumber.create(value);
        // Assert
        (0, vitest_1.expect)(phone.value).toBe('34612345678');
    });
    (0, vitest_1.it)('debe considerar iguales dos PhoneNumbers con los mismos dígitos', () => {
        // Arrange
        const a = PhoneNumber_value_object_1.PhoneNumber.create('612 345 678');
        const b = PhoneNumber_value_object_1.PhoneNumber.create('612345678');
        // Act
        const result = a.equals(b);
        // Assert
        (0, vitest_1.expect)(result).toBe(true);
    });
    (0, vitest_1.it)('debe lanzar si tiene menos de 9 dígitos', () => {
        // Arrange
        const value = '12345';
        // Act & Assert
        (0, vitest_1.expect)(() => PhoneNumber_value_object_1.PhoneNumber.create(value)).toThrow(/debe tener al menos 9 dígitos/);
    });
    (0, vitest_1.it)('debe lanzar si tiene más de 15 dígitos', () => {
        // Arrange
        const value = '1234567890123456';
        // Act & Assert
        (0, vitest_1.expect)(() => PhoneNumber_value_object_1.PhoneNumber.create(value)).toThrow(/máximo 15 dígitos/);
    });
});
