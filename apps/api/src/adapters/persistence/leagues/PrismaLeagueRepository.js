"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaLeagueRepository = void 0;
const League_entity_1 = require("@/domain/leagues/League.entity");
const LeagueId_value_object_1 = require("@/domain/leagues/LeagueId.value-object");
const LeagueCategory_1 = require("@/domain/leagues/LeagueCategory");
const Season_entity_1 = require("@/domain/seasons/Season.entity");
const SeasonId_value_object_1 = require("@/domain/seasons/SeasonId.value-object");
const TeamId_value_object_1 = require("@/domain/teams/TeamId.value-object");
class PrismaLeagueRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    toDomain(row) {
        return League_entity_1.League.create({
            id: LeagueId_value_object_1.LeagueId.fromString(row.id),
            name: row.name,
            leagueCategory: (0, LeagueCategory_1.parseLeagueCategory)(row.leagueCategory),
        });
    }
    toSeasonDomain(row) {
        return Season_entity_1.Season.create({
            id: SeasonId_value_object_1.SeasonId.fromString(row.id),
            year: row.year,
            leagueId: LeagueId_value_object_1.LeagueId.fromString(row.leagueId),
            championId: row.championId ? TeamId_value_object_1.TeamId.fromString(row.championId) : null,
            secondId: row.secondId ? TeamId_value_object_1.TeamId.fromString(row.secondId) : null,
        });
    }
    async findById(id) {
        const row = await this.prisma.league.findUnique({
            where: { id: id.value },
            select: { id: true, name: true, leagueCategory: true },
        });
        return row ? this.toDomain(row) : null;
    }
    async findAll(pagination) {
        const rows = await this.prisma.league.findMany({
            select: { id: true, name: true, leagueCategory: true },
            ...(pagination
                ? {
                    skip: (pagination.page - 1) * pagination.limit,
                    take: pagination.limit,
                }
                : {}),
            orderBy: { name: 'asc' },
        });
        if (pagination === undefined) {
            return rows.map((r) => this.toDomain(r));
        }
        const total = await this.prisma.league.count();
        return {
            data: rows.map((r) => this.toDomain(r)),
            total,
        };
    }
    async save(league) {
        const id = league.id?.value ?? LeagueId_value_object_1.LeagueId.generate().value;
        await this.prisma.league.upsert({
            where: { id },
            update: {
                name: league.name,
                leagueCategory: league.leagueCategory,
            },
            create: {
                id,
                name: league.name,
                leagueCategory: league.leagueCategory,
            },
        });
    }
    async createWithInitialSeason(league, year) {
        const leagueId = league.id?.value ?? LeagueId_value_object_1.LeagueId.generate().value;
        const seasonRow = await this.prisma.$transaction(async (tx) => {
            await tx.league.create({
                data: {
                    id: leagueId,
                    name: league.name,
                    leagueCategory: league.leagueCategory,
                },
            });
            return tx.season.create({
                data: {
                    year,
                    leagueId,
                },
                select: {
                    id: true,
                    year: true,
                    leagueId: true,
                    championId: true,
                    secondId: true,
                },
            });
        });
        return this.toSeasonDomain(seasonRow);
    }
    async delete(id) {
        await this.prisma.league.deleteMany({
            where: { id: id.value },
        });
    }
    async countSeasonsByLeagueId(id) {
        return this.prisma.season.count({
            where: { leagueId: id.value },
        });
    }
}
exports.PrismaLeagueRepository = PrismaLeagueRepository;
