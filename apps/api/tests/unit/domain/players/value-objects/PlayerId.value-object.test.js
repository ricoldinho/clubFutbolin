"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const PlayerId_value_object_1 = require("@/domain/players/value-objects/PlayerId.value-object");
(0, vitest_1.describe)('PlayerId', () => {
    (0, vitest_1.it)('debe crear un PlayerId desde un UUID válido', () => {
        // Arrange
        const value = '550e8400-e29b-41d4-a716-446655440000';
        // Act
        const id = PlayerId_value_object_1.PlayerId.fromString(value);
        // Assert
        (0, vitest_1.expect)(id.value).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
    (0, vitest_1.it)('debe normalizar a minúsculas', () => {
        // Arrange
        const value = '550E8400-E29B-41D4-A716-446655440000';
        // Act
        const id = PlayerId_value_object_1.PlayerId.fromString(value);
        // Assert
        (0, vitest_1.expect)(id.value).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
    (0, vitest_1.it)('debe generar un PlayerId nuevo con generate()', () => {
        // Act
        const id = PlayerId_value_object_1.PlayerId.generate();
        // Assert
        (0, vitest_1.expect)(id.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });
    (0, vitest_1.it)('debe considerar iguales dos PlayerIds con el mismo valor', () => {
        // Arrange
        const a = PlayerId_value_object_1.PlayerId.fromString('550e8400-e29b-41d4-a716-446655440000');
        const b = PlayerId_value_object_1.PlayerId.fromString('550e8400-e29b-41d4-a716-446655440000');
        // Act
        const result = a.equals(b);
        // Assert
        (0, vitest_1.expect)(result).toBe(true);
    });
    (0, vitest_1.it)('debe lanzar si el valor está vacío', () => {
        // Act & Assert
        (0, vitest_1.expect)(() => PlayerId_value_object_1.PlayerId.fromString('   ')).toThrow('PlayerId no puede estar vacío');
    });
    (0, vitest_1.it)('debe lanzar si el formato no es UUID', () => {
        // Act & Assert
        (0, vitest_1.expect)(() => PlayerId_value_object_1.PlayerId.fromString('not-a-uuid')).toThrow(/Formato de PlayerId inválido/);
    });
});
