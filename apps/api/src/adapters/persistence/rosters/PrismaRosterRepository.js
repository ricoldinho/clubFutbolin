"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaRosterRepository = void 0;
const TeamRoster_entity_1 = require("@/domain/rosters/TeamRoster.entity");
const TeamSeasonId_value_object_1 = require("@/domain/rosters/TeamSeasonId.value-object");
const TeamId_value_object_1 = require("@/domain/teams/TeamId.value-object");
const SeasonId_value_object_1 = require("@/domain/seasons/SeasonId.value-object");
const PlayerId_value_object_1 = require("@/domain/players/value-objects/PlayerId.value-object");
const RosterMember_1 = require("@/domain/rosters/RosterMember");
const Position_1 = require("@/domain/rosters/Position");
class PrismaRosterRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findTeamSeasonByTeamAndSeason(teamId, seasonId) {
        const row = await this.prisma.teamSeason.findFirst({
            where: { teamId: teamId.value, seasonId: seasonId.value },
            include: {
                rosterPlayers: true,
            },
        });
        if (!row)
            return null;
        return this.toDomain(row);
    }
    async findById(teamSeasonId) {
        const row = await this.prisma.teamSeason.findUnique({
            where: { id: teamSeasonId.value },
            include: {
                rosterPlayers: true,
            },
        });
        if (!row)
            return null;
        return this.toDomain(row);
    }
    async findBySeasonId(seasonId) {
        const rows = await this.prisma.teamSeason.findMany({
            where: { seasonId: seasonId.value },
            include: {
                rosterPlayers: true,
            },
        });
        return rows.map((row) => this.toDomain(row));
    }
    async findMembershipsByPlayerId(playerId) {
        const rows = await this.prisma.rosterPlayer.findMany({
            where: { playerId: playerId.value },
            select: {
                teamSeason: {
                    select: {
                        id: true,
                        teamId: true,
                        seasonId: true,
                        team: {
                            select: {
                                name: true,
                            },
                        },
                        season: {
                            select: {
                                year: true,
                                leagueId: true,
                                league: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                teamSeason: {
                    season: {
                        year: 'desc',
                    },
                },
            },
        });
        return rows.map(({ teamSeason }) => ({
            teamSeasonId: TeamSeasonId_value_object_1.TeamSeasonId.fromString(teamSeason.id),
            teamId: TeamId_value_object_1.TeamId.fromString(teamSeason.teamId),
            teamName: teamSeason.team.name,
            seasonId: SeasonId_value_object_1.SeasonId.fromString(teamSeason.seasonId),
            seasonYear: teamSeason.season.year,
            leagueId: teamSeason.season.leagueId,
            leagueName: teamSeason.season.league.name,
        }));
    }
    async findMembershipsByTeamId(teamId) {
        const rows = await this.prisma.teamSeason.findMany({
            where: { teamId: teamId.value },
            select: {
                seasonId: true,
                season: {
                    select: {
                        year: true,
                        leagueId: true,
                        league: {
                            select: {
                                name: true,
                                leagueCategory: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                season: { year: 'desc' },
            },
        });
        return rows.map((row) => ({
            seasonId: SeasonId_value_object_1.SeasonId.fromString(row.seasonId),
            seasonYear: row.season.year,
            leagueId: row.season.leagueId,
            leagueName: row.season.league.name,
            leagueCategory: row.season.league.leagueCategory,
        }));
    }
    async findPlayersByTeamId(teamId) {
        const maxYearRow = await this.prisma.teamSeason.findFirst({
            where: { teamId: teamId.value },
            orderBy: { season: { year: 'desc' } },
            select: { season: { select: { year: true } } },
        });
        const maxYear = maxYearRow?.season.year ?? null;
        const rows = await this.prisma.rosterPlayer.findMany({
            where: {
                teamSeason: {
                    teamId: teamId.value,
                },
            },
            select: {
                player: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true,
                        nickname: true,
                        category: true,
                    },
                },
                teamSeason: {
                    select: {
                        season: { select: { year: true } },
                    },
                },
            },
        });
        const dedup = new Map();
        rows.forEach(({ player, teamSeason }) => {
            const seasonYear = teamSeason.season.year;
            const isCurrent = maxYear !== null && seasonYear === maxYear;
            const existing = dedup.get(player.id);
            const next = {
                id: player.id,
                name: player.name,
                lastname: player.lastname,
                nickname: player.nickname,
                category: player.category,
                isCurrent: existing ? existing.isCurrent || isCurrent : isCurrent,
            };
            dedup.set(player.id, next);
        });
        return Array.from(dedup.values()).sort((a, b) => {
            if (a.isCurrent !== b.isCurrent)
                return a.isCurrent ? -1 : 1;
            const last = a.lastname.localeCompare(b.lastname, 'es');
            if (last !== 0)
                return last;
            return a.name.localeCompare(b.name, 'es');
        });
    }
    toDomain(row) {
        const members = row.rosterPlayers.map((rp) => RosterMember_1.RosterMember.create({
            playerId: PlayerId_value_object_1.PlayerId.fromString(rp.playerId),
            position: (0, Position_1.parsePosition)(rp.position),
        }));
        return TeamRoster_entity_1.TeamRoster.create({
            teamSeasonId: TeamSeasonId_value_object_1.TeamSeasonId.fromString(row.id),
            teamId: TeamId_value_object_1.TeamId.fromString(row.teamId),
            seasonId: SeasonId_value_object_1.SeasonId.fromString(row.seasonId),
            members,
        });
    }
    async saveTeamSeason(roster) {
        const id = roster.teamSeasonId.value;
        await this.prisma.teamSeason.upsert({
            where: { id },
            update: {},
            create: {
                id,
                teamId: roster.teamId.value,
                seasonId: roster.seasonId.value,
            },
        });
    }
    async saveRoster(roster) {
        const teamSeasonId = roster.teamSeasonId.value;
        await this.prisma.rosterPlayer.deleteMany({
            where: { teamSeasonId },
        });
        for (const m of roster.members) {
            await this.prisma.rosterPlayer.create({
                data: {
                    teamSeasonId,
                    playerId: m.playerId.value,
                    position: m.position,
                },
            });
        }
    }
}
exports.PrismaRosterRepository = PrismaRosterRepository;
