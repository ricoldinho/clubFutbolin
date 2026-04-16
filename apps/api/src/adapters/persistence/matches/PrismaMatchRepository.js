"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaMatchRepository = void 0;
const Match_entity_1 = require("@/domain/matches/Match.entity");
const MatchId_value_object_1 = require("@/domain/matches/MatchId.value-object");
const MatchScore_value_object_1 = require("@/domain/matches/MatchScore.value-object");
const MatchStatus_1 = require("@/domain/matches/MatchStatus");
const TeamSeasonId_value_object_1 = require("@/domain/rosters/TeamSeasonId.value-object");
const SeasonId_value_object_1 = require("@/domain/seasons/SeasonId.value-object");
/**
 * Implementación Prisma del repositorio de Match.
 * Mantiene mapping explícito entre filas y agregado de dominio.
 */
class PrismaMatchRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async existsBySeasonId(seasonId) {
        const count = await this.prisma.match.count({
            where: { seasonId: seasonId.value },
            take: 1,
        });
        return count > 0;
    }
    async findById(matchId) {
        const row = await this.prisma.match.findUnique({
            where: { id: matchId.value },
            select: {
                id: true,
                seasonId: true,
                homeTeamSeasonId: true,
                awayTeamSeasonId: true,
                homeScore: true,
                awayScore: true,
                date: true,
                round: true,
                status: true,
            },
        });
        return row ? this.toDomain(row) : null;
    }
    async findBySeasonId(seasonId, filters) {
        const where = {
            seasonId: seasonId.value,
            ...(filters.round !== undefined ? { round: filters.round } : {}),
        };
        const rows = await this.prisma.match.findMany({
            where,
            select: {
                id: true,
                seasonId: true,
                homeTeamSeasonId: true,
                awayTeamSeasonId: true,
                homeScore: true,
                awayScore: true,
                date: true,
                round: true,
                status: true,
            },
            orderBy: [{ round: 'asc' }, { date: 'asc' }, { id: 'asc' }],
            skip: (filters.page - 1) * filters.limit,
            take: filters.limit,
        });
        const total = await this.prisma.match.count({ where });
        return {
            data: rows.map((row) => this.toDomain(row)),
            total,
        };
    }
    async save(match) {
        const id = match.id?.value ?? MatchId_value_object_1.MatchId.generate().value;
        await this.prisma.match.upsert({
            where: { id },
            update: {
                seasonId: match.seasonId.value,
                homeTeamSeasonId: match.homeTeamSeasonId.value,
                awayTeamSeasonId: match.awayTeamSeasonId.value,
                homeScore: match.score.home,
                awayScore: match.score.away,
                date: match.date,
                round: match.round,
                status: match.status,
            },
            create: {
                id,
                seasonId: match.seasonId.value,
                homeTeamSeasonId: match.homeTeamSeasonId.value,
                awayTeamSeasonId: match.awayTeamSeasonId.value,
                homeScore: match.score.home,
                awayScore: match.score.away,
                date: match.date,
                round: match.round,
                status: match.status,
            },
        });
    }
    async saveMany(matches) {
        if (matches.length === 0) {
            return;
        }
        await this.prisma.match.createMany({
            data: matches.map((match) => ({
                id: match.id?.value ?? MatchId_value_object_1.MatchId.generate().value,
                seasonId: match.seasonId.value,
                homeTeamSeasonId: match.homeTeamSeasonId.value,
                awayTeamSeasonId: match.awayTeamSeasonId.value,
                homeScore: match.score.home,
                awayScore: match.score.away,
                date: match.date,
                round: match.round,
                status: match.status,
            })),
        });
    }
    async updateRoundDate(seasonId, round, date) {
        const result = await this.prisma.match.updateMany({
            where: {
                seasonId: seasonId.value,
                round,
            },
            data: { date },
        });
        return result.count;
    }
    toDomain(row) {
        return Match_entity_1.Match.create({
            id: MatchId_value_object_1.MatchId.fromString(row.id),
            seasonId: SeasonId_value_object_1.SeasonId.fromString(row.seasonId),
            homeTeamSeasonId: TeamSeasonId_value_object_1.TeamSeasonId.fromString(row.homeTeamSeasonId),
            awayTeamSeasonId: TeamSeasonId_value_object_1.TeamSeasonId.fromString(row.awayTeamSeasonId),
            score: MatchScore_value_object_1.MatchScore.fromNullable(row.homeScore, row.awayScore),
            date: row.date,
            round: row.round,
            status: (0, MatchStatus_1.parseMatchStatus)(row.status),
        });
    }
}
exports.PrismaMatchRepository = PrismaMatchRepository;
