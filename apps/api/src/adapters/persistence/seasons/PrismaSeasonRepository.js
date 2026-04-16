"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaSeasonRepository = void 0;
const Season_entity_1 = require("@/domain/seasons/Season.entity");
const SeasonId_value_object_1 = require("@/domain/seasons/SeasonId.value-object");
const LeagueId_value_object_1 = require("@/domain/leagues/LeagueId.value-object");
const TeamId_value_object_1 = require("@/domain/teams/TeamId.value-object");
class PrismaSeasonRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    toDomain(row) {
        return Season_entity_1.Season.create({
            id: SeasonId_value_object_1.SeasonId.fromString(row.id),
            year: row.year,
            leagueId: LeagueId_value_object_1.LeagueId.fromString(row.leagueId),
            championId: row.championId ? TeamId_value_object_1.TeamId.fromString(row.championId) : null,
            secondId: row.secondId ? TeamId_value_object_1.TeamId.fromString(row.secondId) : null,
        });
    }
    async findById(id) {
        const row = await this.prisma.season.findUnique({
            where: { id: id.value },
            select: { id: true, year: true, leagueId: true, championId: true, secondId: true },
        });
        return row ? this.toDomain(row) : null;
    }
    async findLatestByYear() {
        const row = await this.prisma.season.findFirst({
            select: { id: true, year: true, leagueId: true, championId: true, secondId: true },
            orderBy: [{ year: 'desc' }, { id: 'asc' }],
        });
        return row ? this.toDomain(row) : null;
    }
    async findAll(pagination) {
        const rows = await this.prisma.season.findMany({
            select: { id: true, year: true, leagueId: true, championId: true, secondId: true },
            ...(pagination
                ? {
                    skip: (pagination.page - 1) * pagination.limit,
                    take: pagination.limit,
                }
                : {}),
            orderBy: [{ year: 'asc' }, { id: 'asc' }],
        });
        if (pagination === undefined) {
            return rows.map((r) => this.toDomain(r));
        }
        const total = await this.prisma.season.count();
        return {
            data: rows.map((r) => this.toDomain(r)),
            total,
        };
    }
    async findByLeagueId(leagueId) {
        const rows = await this.prisma.season.findMany({
            where: { leagueId: leagueId.value },
            select: { id: true, year: true, leagueId: true, championId: true, secondId: true },
        });
        return rows.map((r) => this.toDomain(r));
    }
    async save(season) {
        const id = season.id?.value ?? SeasonId_value_object_1.SeasonId.generate().value;
        await this.prisma.season.upsert({
            where: { id },
            update: {
                year: season.year,
                leagueId: season.leagueId.value,
                championId: season.championId?.value ?? null,
                secondId: season.secondId?.value ?? null,
            },
            create: {
                id,
                year: season.year,
                leagueId: season.leagueId.value,
                championId: season.championId?.value ?? null,
                secondId: season.secondId?.value ?? null,
            },
        });
    }
    async delete(id) {
        await this.prisma.season.deleteMany({
            where: { id: id.value },
        });
    }
}
exports.PrismaSeasonRepository = PrismaSeasonRepository;
