/**
 * Rol del Player para autorización.
 * USER: usuario normal (registro público).
 * ADMIN: solo un ADMIN puede asignar este rol a otro Player.
 */
export enum PlayerRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

const VALID_ROLES: string[] = Object.values(PlayerRole);

export function isPlayerRole(value: string): value is PlayerRole {
  return VALID_ROLES.includes(value);
}

export function parsePlayerRole(value: string): PlayerRole {
  if (!isPlayerRole(value)) {
    throw new Error(`Rol inválido: ${value}. Debe ser uno de: ${VALID_ROLES.join(', ')}`);
  }
  return value as PlayerRole;
}
