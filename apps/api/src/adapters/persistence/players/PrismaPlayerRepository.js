"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaPlayerRepository = void 0;
const Player_entity_1 = require("@/domain/players/Player.entity");
const value_objects_1 = require("@/domain/players/value-objects");
const PlayerCategory_1 = require("@/domain/players/PlayerCategory");
const PlayerRole_1 = require("@/domain/players/PlayerRole");
const errors_1 = require("@/domain/shared/errors");
class PrismaPlayerRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    static searchWhere(searchQuery) {
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
    toDomain(row) {
        return Player_entity_1.Player.create({
            id: value_objects_1.PlayerId.fromString(row.id),
            name: row.name,
            lastname: row.lastname,
            nickname: row.nickname,
            email: value_objects_1.Email.create(row.email),
            phoneNumber: value_objects_1.PhoneNumber.create(row.phoneNumber),
            birthdate: value_objects_1.Birthdate.create(row.birthdate),
            category: (0, PlayerCategory_1.parsePlayerCategory)(row.category),
            role: (0, PlayerRole_1.parsePlayerRole)(row.role),
        });
    }
    async findByEmail(email) {
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
        return row ? this.toDomain(row) : null;
    }
    async findById(id) {
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
        return row ? this.toDomain(row) : null;
    }
    async findAll(pagination, filters) {
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
            return rows.map((row) => this.toDomain(row));
        }
        const total = await this.prisma.player.count({ where });
        return {
            data: rows.map((row) => this.toDomain(row)),
            total,
        };
    }
    async findLoginDataByEmail(email) {
        const row = await this.prisma.player.findUnique({
            where: { email: email.value },
            select: { id: true, role: true, passwordHash: true },
        });
        if (!row)
            return null;
        return {
            playerId: value_objects_1.PlayerId.fromString(row.id),
            role: (0, PlayerRole_1.parsePlayerRole)(row.role),
            passwordHash: row.passwordHash,
        };
    }
    async save(player, passwordHash) {
        const id = player.id?.value ?? value_objects_1.PlayerId.generate().value;
        const baseData = {
            email: player.email.value,
            name: player.name,
            lastname: player.lastname,
            nickname: player.nickname,
            phoneNumber: player.phoneNumber.value,
            birthdate: player.birthdate.value,
            category: player.category,
            role: player.role,
        };
        const existing = await this.prisma.player.findUnique({
            where: { id },
            select: { id: true },
        });
        let createPasswordHash;
        if (existing) {
            createPasswordHash = passwordHash ?? '';
        }
        else {
            if (passwordHash === undefined || passwordHash === '') {
                throw new errors_1.InfrastructureError('Password hash is required when creating a new player');
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
    async delete(id) {
        await this.prisma.player.deleteMany({
            where: { id: id.value },
        });
    }
}
exports.PrismaPlayerRepository = PrismaPlayerRepository;
