import { PrismaClient, PlayerCategory as PrismaPlayerCategory } from '@prisma/client';
import { Player } from '@/domain/players/Player.entity';
import { Email, PhoneNumber, Birthdate, PlayerId } from '@/domain/players/value-objects';
import { PlayerCategory, parsePlayerCategory } from '@/domain/players/PlayerCategory';
import type { IPlayerRepository } from '@/application/ports/players/Player.repository';

type PrismaPlayer = {
  id: string;
  email: string;
  name: string;
  lastname: string;
  nickname: string | null;
  phoneNumber: string;
  league: string[];
  birthdate: Date;
  category: PrismaPlayerCategory;
};

export class PrismaPlayerRepository implements IPlayerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(row: PrismaPlayer): Player {
    return Player.create({
      id: PlayerId.fromString(row.id),
      name: row.name,
      lastname: row.lastname,
      nickname: row.nickname,
      email: Email.create(row.email),
      phoneNumber: PhoneNumber.create(row.phoneNumber),
      league: row.league,
      birthdate: Birthdate.create(row.birthdate),
      category: parsePlayerCategory(row.category as unknown as string),
    });
  }

  async findByEmail(email: Email): Promise<Player | null> {
    const row = await this.prisma.player.findUnique({
      where: { email: email.value },
      select: {
        id: true,
        email: true,
        name: true,
        lastname: true,
        nickname: true,
        phoneNumber: true,
        league: true,
        birthdate: true,
        category: true,
      },
    });
    return row ? this.toDomain(row) : null;
  }

  async findById(id: PlayerId): Promise<Player | null> {
    const row = await this.prisma.player.findUnique({
      where: { id: id.value },
      select: {
        id: true,
        email: true,
        name: true,
        lastname: true,
        nickname: true,
        phoneNumber: true,
        league: true,
        birthdate: true,
        category: true,
      },
    });
    return row ? this.toDomain(row) : null;
  }

  async findAll(): Promise<Player[]> {
    const rows = await this.prisma.player.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        lastname: true,
        nickname: true,
        phoneNumber: true,
        league: true,
        birthdate: true,
        category: true,
      },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async save(player: Player): Promise<void> {
    const id = player.id?.value ?? PlayerId.generate().value;

    const data = {
      id,
      email: player.email.value,
      name: player.name,
      lastname: player.lastname,
      nickname: player.nickname,
      phoneNumber: player.phoneNumber.value,
      league: [...player.league],
      birthdate: player.birthdate.value,
      category: player.category as PrismaPlayerCategory,
    };

    await this.prisma.player.upsert({
      where: { id: data.id },
      update: {
        email: data.email,
        name: data.name,
        lastname: data.lastname,
        nickname: data.nickname,
        phoneNumber: data.phoneNumber,
        league: data.league,
        birthdate: data.birthdate,
        category: data.category,
      },
      create: data,
    });
  }

  async delete(id: PlayerId): Promise<void> {
    await this.prisma.player.deleteMany({
      where: { id: id.value },
    });
  }
}

