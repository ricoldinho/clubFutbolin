"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryRosterRepository = void 0;
class InMemoryRosterRepository {
    constructor() {
        this.rosters = [];
    }
    async findTeamSeasonByTeamAndSeason(teamId, seasonId) {
        return (this.rosters.find((r) => r.teamId.equals(teamId) && r.seasonId.equals(seasonId)) ?? null);
    }
    async findById(teamSeasonId) {
        return this.rosters.find((r) => r.teamSeasonId.equals(teamSeasonId)) ?? null;
    }
    async findBySeasonId(seasonId) {
        return this.rosters.filter((r) => r.seasonId.equals(seasonId));
    }
    async findMembershipsByPlayerId(_playerId) {
        return [];
    }
    async findMembershipsByTeamId(_teamId) {
        return [];
    }
    async findPlayersByTeamId(_teamId) {
        return [];
    }
    async saveTeamSeason(roster) {
        const existing = this.rosters.find((r) => r.teamSeasonId.equals(roster.teamSeasonId));
        if (!existing) {
            this.rosters.push(roster);
        }
    }
    async saveRoster(roster) {
        const idx = this.rosters.findIndex((r) => r.teamSeasonId.equals(roster.teamSeasonId));
        if (idx >= 0) {
            this.rosters[idx] = roster;
        }
        else {
            this.rosters.push(roster);
        }
    }
}
exports.InMemoryRosterRepository = InMemoryRosterRepository;
