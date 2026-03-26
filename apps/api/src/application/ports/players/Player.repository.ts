import type { PlayerRole } from '@/domain/players/PlayerRole';
import { Player } from '@/domain/players/Player.entity';
import { Email } from '@/domain/players/value-objects/Email.value-object';
import { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';
import type { PaginationParams } from '@/shared/pagination';

/**
 * DTO solo para login: datos necesarios para verificar contraseña y emitir JWT.
 * No expone la entidad Player con datos sensibles.
 */
export interface PlayerLoginData {
  playerId: PlayerId;
  role: PlayerRole;
  passwordHash: string;
}

/**
 * Puerto del repositorio de Player (implementado en adapters/persistence, ej. Prisma).
 *
 * Invariante de dominio: un email solo puede pertenecer a un Player.
 * - El caso de uso que crea/registra un Player debe llamar a findByEmail(email)
 *   antes de crear; si devuelve un Player, rechazar con "Email ya en uso".
 * - En PostgreSQL, columna email con UNIQUE para garantía a nivel BD.
 */
/** Paginación 1-based para listados de `Player` en repositorio. */
export interface PlayerListResult {
  readonly data: Player[];
  readonly total: number;
}

export interface IPlayerRepository {
  findByEmail(email: Email): Promise<Player | null>;

  findById(id: PlayerId): Promise<Player | null>;

  /**
   * Lista jugadores con paginación obligatoria y total para metadata.
   */
  findAll(): Promise<Player[]>;
  findAll(pagination: PaginationParams): Promise<PlayerListResult>;

  /**
   * Persiste un Player. En registro (create) se debe pasar passwordHash.
   * En actualización (update) no se pasa; se mantiene el hash existente.
   */
  save(player: Player, passwordHash?: string): Promise<void>;

  /**
   * Datos para login: busca por email y devuelve id, role y hash (nunca la entidad completa).
   * Si no existe, devuelve null.
   */
  findLoginDataByEmail(email: Email): Promise<PlayerLoginData | null>;

  /**
   * Elimina un Player por id. Si no existe, no hace nada.
   * El caso de uso es responsable de comprobar existencia previa si necesita
   * devolver un NotFoundError.
   */
  delete(id: PlayerId): Promise<void>;
}
