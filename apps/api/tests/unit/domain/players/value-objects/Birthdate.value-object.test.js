"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const Birthdate_value_object_1 = require("@/domain/players/value-objects/Birthdate.value-object");
(0, vitest_1.describe)('Birthdate', () => {
    (0, vitest_1.it)('debe crear una Birthdate válida desde Date', () => {
        // Arrange
        const value = new Date('2005-03-15');
        // Act
        const birthdate = Birthdate_value_object_1.Birthdate.create(value);
        // Assert
        (0, vitest_1.expect)(birthdate.value).toEqual(new Date('2005-03-15'));
    });
    (0, vitest_1.it)('debe crear una Birthdate válida desde string ISO', () => {
        // Arrange
        const value = '2000-01-01';
        // Act
        const birthdate = Birthdate_value_object_1.Birthdate.create(value);
        // Assert
        (0, vitest_1.expect)(birthdate.value).toEqual(new Date('2000-01-01'));
    });
    (0, vitest_1.it)('debe considerar iguales dos Birthdates con la misma fecha', () => {
        // Arrange
        const a = Birthdate_value_object_1.Birthdate.create('1990-05-20');
        const b = Birthdate_value_object_1.Birthdate.create(new Date('1990-05-20'));
        // Act
        const result = a.equals(b);
        // Assert
        (0, vitest_1.expect)(result).toBe(true);
    });
    (0, vitest_1.it)('debe lanzar si la fecha es inválida', () => {
        // Arrange
        const value = 'no-es-una-fecha';
        // Act & Assert
        (0, vitest_1.expect)(() => Birthdate_value_object_1.Birthdate.create(value)).toThrow(/Fecha inválida/);
    });
    (0, vitest_1.it)('debe lanzar si la fecha es futura', () => {
        // Arrange
        const future = new Date();
        future.setFullYear(future.getFullYear() + 1);
        // Act & Assert
        (0, vitest_1.expect)(() => Birthdate_value_object_1.Birthdate.create(future)).toThrow(/La fecha de nacimiento no puede ser futura/);
    });
});
