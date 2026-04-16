"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const Player_entity_1 = require("@/domain/players/Player.entity");
const PlayerCategory_1 = require("@/domain/players/PlayerCategory");
const PlayerRole_1 = require("@/domain/players/PlayerRole");
const Email_value_object_1 = require("@/domain/players/value-objects/Email.value-object");
const PhoneNumber_value_object_1 = require("@/domain/players/value-objects/PhoneNumber.value-object");
const Birthdate_value_object_1 = require("@/domain/players/value-objects/Birthdate.value-object");
const PlayerId_value_object_1 = require("@/domain/players/value-objects/PlayerId.value-object");
(0, vitest_1.describe)('Player', () => {
    const baseProps = {
        name: 'Luis',
        lastname: 'García',
        nickname: 'Luigi',
        email: Email_value_object_1.Email.create('luis.garcia@example.com'),
        phoneNumber: PhoneNumber_value_object_1.PhoneNumber.create('+34 612 345 678'),
        birthdate: Birthdate_value_object_1.Birthdate.create('2005-03-15'),
        category: PlayerCategory_1.PlayerCategory.PRIMERA,
        role: PlayerRole_1.PlayerRole.USER,
    };
    (0, vitest_1.it)('debe crear un Player con todas las propiedades', () => {
        // Arrange
        const props = { ...baseProps };
        // Act
        const player = Player_entity_1.Player.create(props);
        // Assert
        (0, vitest_1.expect)(player.name).toBe('Luis');
        (0, vitest_1.expect)(player.lastname).toBe('García');
        (0, vitest_1.expect)(player.nickname).toBe('Luigi');
        (0, vitest_1.expect)(player.email.value).toBe('luis.garcia@example.com');
        (0, vitest_1.expect)(player.phoneNumber.value).toBe('34612345678');
        (0, vitest_1.expect)(player.birthdate.value).toEqual(new Date('2005-03-15'));
        (0, vitest_1.expect)(player.category).toBe(PlayerCategory_1.PlayerCategory.PRIMERA);
        (0, vitest_1.expect)(player.id).toBeUndefined();
    });
    (0, vitest_1.it)('debe crear un Player con id cuando se pasa en las props', () => {
        // Arrange
        const id = PlayerId_value_object_1.PlayerId.fromString('550e8400-e29b-41d4-a716-446655440000');
        const props = { ...baseProps, id };
        // Act
        const player = Player_entity_1.Player.create(props);
        // Assert
        (0, vitest_1.expect)(player.id).toBeDefined();
        (0, vitest_1.expect)(player.id?.value).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
    (0, vitest_1.it)('debe devolver fullName como nombre y apellido concatenados', () => {
        // Arrange
        const player = Player_entity_1.Player.create(baseProps);
        // Act
        const fullName = player.fullName;
        // Assert
        (0, vitest_1.expect)(fullName).toBe('Luis García');
    });
    (0, vitest_1.it)('debe aceptar nickname null', () => {
        // Arrange
        const props = { ...baseProps, nickname: null };
        // Act
        const player = Player_entity_1.Player.create(props);
        // Assert
        (0, vitest_1.expect)(player.nickname).toBeNull();
    });
});
