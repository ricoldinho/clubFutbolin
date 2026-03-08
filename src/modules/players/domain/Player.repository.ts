import { Player } from './Player.entity';
import { Email } from './value-objects/Email.value-object';
import { PlayerId } from './value-objects/PlayerId.value-object';

/**
 * Puerto del repositorio de Player (implementado en infraestructura, ej. Prisma).
 *
 * Invariante de dominio: un email solo puede pertenecer a un Player.
 * - El caso de uso que crea/registra un Player debe llamar a findByEmail(email)
 *   antes de crear; si devuelve un Player, rechazar con "Email ya en uso".
 * - En PostgreSQL, columna email con UNIQUE para garantía a nivel BD.
 */
export interface IPlayerRepository {
  findByEmail(email: Email): Promise<Player | null>;

  findById(id: PlayerId): Promise<Player | null>;

  save(player: Player): Promise<void>;
}
