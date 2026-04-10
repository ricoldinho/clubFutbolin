import {
  type Prisma,
  PrismaClient,
  PlayerCategory as PrismaPlayerCategory,
  PlayerRole as PrismaPlayerRole,
} from "@prisma/client";
import { Player } from "@/domain/players/Player.entity";
import {
  Email,
  PhoneNumber,
  Birthdate,
  PlayerId,
} from "@/domain/players/value-objects";
import { parsePlayerCategory } from "@/domain/players/PlayerCategory";
import { parsePlayerRole } from "@/domain/players/PlayerRole";
import { InfrastructureError } from "@/domain/shared/errors";
import type {
  IPlayerRepository,
  ListPlayersFilters,
  PlayerListResult,
  PlayerLoginData,
} from "@/application/ports/players/Player.repository";
import type { PaginationParams } from "@/shared/pagination";

type PrismaPlayer = {
  id: string;
  email: string;
  name: string;
  lastname: string;
  nickname: string | null;
  phoneNumber: string;
  birthdate: Date;
  category: PrismaPlayerCategory;
  role: PrismaPlayerRole;
};

export class PrismaPlayerRepository implements IPlayerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private static searchWhere(searchQuery?: string): Prisma.PlayerWhereInput {
    const trimmed = searchQuery?.trim();
    if (trimmed === undefined || trimmed.length === 0) {
      return {};
    }
    return {
      OR: [
        { name: { contains: trimmed, mode: "insensitive" } },
        { lastname: { contains: trimmed, mode: "insensitive" } },
        { nickname: { contains: trimmed, mode: "insensitive" } },
      ],
    };
  }

  private toDomain(row: PrismaPlayer): Player {
    return Player.create({
      id: PlayerId.fromString(row.id),
      name: row.name,
      lastname: row.lastname,
      nickname: row.nickname,
      email: Email.create(row.email),
      phoneNumber: PhoneNumber.create(row.phoneNumber),
      birthdate: Birthdate.create(row.birthdate),
      category: parsePlayerCategory(row.category as unknown as string),
      role: parsePlayerRole(row.role),
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
        birthdate: true,
        category: true,
        role: true,
      },
    });
    return row ? this.toDomain(row as PrismaPlayer) : null;
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
        birthdate: true,
        category: true,
        role: true,
      },
    });
    return row ? this.toDomain(row as PrismaPlayer) : null;
  }

  async findAll(): Promise<Player[]>;
  async findAll(
    pagination: PaginationParams,
    filters?: ListPlayersFilters,
  ): Promise<PlayerListResult>;
  async findAll(
    pagination?: PaginationParams,
    filters?: ListPlayersFilters,
  ): Promise<Player[] | PlayerListResult> {
    const where = PrismaPlayerRepository.searchWhere(filters?.searchQuery);
    const rows = await this.prisma.player.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        lastname: true,
        nickname: true,
        phoneNumber: true,
        birthdate: true,
        category: true,
        role: true,
      },
      orderBy: { createdAt: 'asc' },
      ...(pagination
        ? {
            skip: (pagination.page - 1) * pagination.limit,
            take: pagination.limit,
          }
        : {}),
    });
    if (pagination === undefined) {
      return rows.map((row: PrismaPlayer) => this.toDomain(row));
    }
    const total = await this.prisma.player.count({ where });
    return {
      data: rows.map((row: PrismaPlayer) => this.toDomain(row)),
      total,
    };
  }

  async findLoginDataByEmail(email: Email): Promise<PlayerLoginData | null> {
    const row = await this.prisma.player.findUnique({
      where: { email: email.value },
      select: { id: true, role: true, passwordHash: true },
    });
    if (!row) return null;
    return {
      playerId: PlayerId.fromString(row.id),
      role: parsePlayerRole(row.role),
      passwordHash: row.passwordHash,
    };
  }

  async save(player: Player, passwordHash?: string): Promise<void> {
    const id = player.id?.value ?? PlayerId.generate().value;

    const baseData = {
      email: player.email.value,
      name: player.name,
      lastname: player.lastname,
      nickname: player.nickname,
      phoneNumber: player.phoneNumber.value,
      birthdate: player.birthdate.value,
      category: player.category as PrismaPlayerCategory,
      role: player.role as PrismaPlayerRole,
    };

    const existing = await this.prisma.player.findUnique({
      where: { id },
      select: { id: true },
    });

    let createPasswordHash: string;
    if (existing) {
      createPasswordHash = passwordHash ?? '';
    } else {
      if (passwordHash === undefined || passwordHash === '') {
        throw new InfrastructureError(
          'Password hash is required when creating a new player',
        );
      }
      createPasswordHash = passwordHash;
    }

    await this.prisma.player.upsert({
      where: { id },
      update: {
        ...baseData,
        ...(passwordHash !== undefined && { passwordHash }),
      },
      create: {
        id,
        ...baseData,
        passwordHash: createPasswordHash,
      },
    });
  }

  async delete(id: PlayerId): Promise<void> {
    await this.prisma.player.deleteMany({
      where: { id: id.value },
    });
  }
}
