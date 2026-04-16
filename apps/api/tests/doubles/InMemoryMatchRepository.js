"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryMatchRepository = void 0;
const Match_entity_1 = require("@/domain/matches/Match.entity");
class InMemoryMatchRepository {
    constructor() {
        this.matches = [];
    }
    async existsBySeasonId(seasonId) {
        return this.matches.some((match) => match.seasonId.equals(seasonId));
    }
    async findById(matchId) {
        return this.matches.find((match) => match.id?.equals(matchId) ?? false) ?? null;
    }
    async findBySeasonId(seasonId, filters) {
        const filteredBySeason = this.matches.filter((match) => match.seasonId.equals(seasonId));
        const filteredByRound = filters.round === undefined
            ? filteredBySeason
            : filteredBySeason.filter((match) => match.round === filters.round);
        const start = (filters.page - 1) * filters.limit;
        const end = start + filters.limit;
        const data = filteredByRound.slice(start, end);
        return {
            data,
            total: filteredByRound.length,
        };
    }
    async save(match) {
        const index = this.matches.findIndex((stored) => stored.id?.equals(match.id) ?? false);
        if (index === -1) {
            this.matches.push(match);
            return;
        }
        this.matches[index] = match;
    }
    async saveMany(matches) {
        for (const match of matches) {
            await this.save(match);
        }
    }
    async updateRoundDate(seasonId, round, date) {
        let updatedCount = 0;
        for (let i = 0; i < this.matches.length; i += 1) {
            const current = this.matches[i];
            if (!current.seasonId.equals(seasonId) || current.round !== round) {
                continue;
            }
            this.matches[i] = Match_entity_1.Match.create({
                id: current.id,
                seasonId: current.seasonId,
                homeTeamSeasonId: current.homeTeamSeasonId,
                awayTeamSeasonId: current.awayTeamSeasonId,
                score: current.score,
                date,
                round: current.round,
                status: current.status,
            });
            updatedCount += 1;
        }
        return updatedCount;
    }
}
exports.InMemoryMatchRepository = InMemoryMatchRepository;
