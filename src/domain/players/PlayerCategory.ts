/**
 * Categoría de liga del jugador.
 */
export enum PlayerCategory {
  CUARTA = 'CUARTA',
  TERCERA = 'TERCERA',
  SEGUNDA = 'SEGUNDA',
  PRIMERA = 'PRIMERA',
  ELITE = 'ELITE',
}

const VALID_CATEGORIES: Set<string> = new Set(Object.values(PlayerCategory));

export function isPlayerCategory(value: string): value is PlayerCategory {
  return VALID_CATEGORIES.has(value);
}

export function parsePlayerCategory(value: string): PlayerCategory {
  if (!isPlayerCategory(value)) {
    throw new Error(
      `Categoría inválida: "${value}". Valores permitidos: ${Array.from(VALID_CATEGORIES).join(', ')}`
    );
  }
  return value;
}
