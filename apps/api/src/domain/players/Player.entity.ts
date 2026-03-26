import { Email } from './value-objects/Email.value-object';
import { PhoneNumber } from './value-objects/PhoneNumber.value-object';
import { Birthdate } from './value-objects/Birthdate.value-object';
import { PlayerId } from './value-objects/PlayerId.value-object';
import { PlayerCategory } from './PlayerCategory';
import type { PlayerRole } from './PlayerRole';

/**
 * Entidad de dominio Player.
 * Identidad: PlayerId (UUID v7 recomendado). Opcional al crear; obligatorio cuando se carga desde persistencia.
 *
 * Invariante: un email solo puede pertenecer a un Player. Quien cree un Player debe comprobar
 * antes (p. ej. IPlayerRepository.findByEmail) que el email no esté en uso; en BD, UNIQUE en email.
 */
export interface PlayerProps {
  name: string;
  lastname: string;
  nickname: string | null;
  email: Email;
  phoneNumber: PhoneNumber;
  birthdate: Birthdate;
  category: PlayerCategory;
  role: PlayerRole;
}

export interface PlayerIdProps extends PlayerProps {
  id: PlayerId;
}

export class Player {
  readonly id?: PlayerId;
  readonly name: string;
  readonly lastname: string;
  readonly nickname: string | null;
  readonly email: Email;
  readonly phoneNumber: PhoneNumber;
  readonly birthdate: Birthdate;
  readonly category: PlayerCategory;
  readonly role: PlayerRole;

  private constructor(props: PlayerProps | PlayerIdProps) {
    const withId = props as PlayerIdProps;
    if (withId.id !== undefined) {
      this.id = withId.id;
    }
    this.name = props.name;
    this.lastname = props.lastname;
    this.nickname = props.nickname;
    this.email = props.email;
    this.phoneNumber = props.phoneNumber;
    this.birthdate = props.birthdate;
    this.category = props.category;
    this.role = props.role;
  }

  static create(props: PlayerProps | PlayerIdProps): Player {
    return new Player(props);
  }

  get fullName(): string {
    return `${this.name} ${this.lastname}`.trim();
  }
}
