"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaTeamRepository = void 0;
const Team_entity_1 = require("@/domain/teams/Team.entity");
const TeamId_value_object_1 = require("@/domain/teams/TeamId.value-object");
class PrismaTeamRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    static searchWhere(searchQuery) {
        const trimmed = searchQuery?.trim();
        if (trimmed === undefined || trimmed.length === 0) {
            return {};
        }
        return { name: { contains: trimmed, mode: 'insensitive' } };
    }
    toDomain(row) {
        return Team_entity_1.Team.create({
            id: TeamId_value_object_1.TeamId.fromString(row.id),
            name: row.name,
            createdAt: row.createdAt,
        });
    }
    async findById(id) {
        const row = await this.prisma.team.findUnique({
            where: { id: id.value },
            select: { id: true, name: true, createdAt: true },
        });
        return row ? this.toDomain(row) : null;
    }
    async findByName(name) {
        const row = await this.prisma.team.findUnique({
            where: { name: name.trim() },
            select: { id: true, name: true, createdAt: true },
        });
        return row ? this.toDomain(row) : null;
    }
    async findAll(pagination, filters) {
        const where = PrismaTeamRepository.searchWhere(filters?.searchQuery);
        const rows = await this.prisma.team.findMany({
            where,
            select: { id: true, name: true, createdAt: true },
            ...(pagination
                ? {
                    skip: (pagination.page - 1) * pagination.limit,
                    take: pagination.limit,
                }
                : {}),
            orderBy: { createdAt: 'asc' },
        });
        if (pagination === undefined) {
            return rows.map((r) => this.toDomain(r));
        }
        const total = await this.prisma.team.count({ where });
        return {
            data: rows.map((r) => this.toDomain(r)),
            total,
        };
    }
    async save(team) {
        const id = team.id?.value ?? TeamId_value_object_1.TeamId.generate().value;
        await this.prisma.team.upsert({
            where: { id },
            update: { name: team.name },
            create: {
                id,
                name: team.name,
                createdAt: team.createdAt,
            },
        });
    }
    async delete(id) {
        await this.prisma.team.deleteMany({
            where: { id: id.value },
        });
    }
}
exports.PrismaTeamRepository = PrismaTeamRepository;
