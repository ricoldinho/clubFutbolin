"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryLeagueRepository = void 0;
const Season_entity_1 = require("@/domain/seasons/Season.entity");
const SeasonId_value_object_1 = require("@/domain/seasons/SeasonId.value-object");
class InMemoryLeagueRepository {
    constructor(seasonRepository) {
        this.seasonRepository = seasonRepository;
        this.leagues = [];
        this.seasonCounts = new Map();
    }
    async findById(id) {
        return this.leagues.find((l) => l.id?.equals(id)) ?? null;
    }
    async findAll(pagination) {
        const all = [...this.leagues];
        if (pagination === undefined) {
            return all;
        }
        const start = (pagination.page - 1) * pagination.limit;
        return {
            data: all.slice(start, start + pagination.limit),
            total: all.length,
        };
    }
    async save(league) {
        const id = league.id;
        if (id === undefined) {
            this.leagues.push(league);
            return;
        }
        const existing = this.leagues.findIndex((l) => l.id?.equals(id));
        if (existing >= 0) {
            this.leagues[existing] = league;
        }
        else {
            this.leagues.push(league);
        }
    }
    async createWithInitialSeason(league, year) {
        await this.save(league);
        const season = Season_entity_1.Season.create({
            id: SeasonId_value_object_1.SeasonId.generate(),
            leagueId: league.id,
            year,
        });
        this.seasonCounts.set(league.id.value, (this.seasonCounts.get(league.id.value) ?? 0) + 1);
        if (this.seasonRepository) {
            await this.seasonRepository.save(season);
        }
        return season;
    }
    async delete(id) {
        this.seasonCounts.delete(id.value);
        const idx = this.leagues.findIndex((l) => l.id?.equals(id));
        if (idx >= 0)
            this.leagues.splice(idx, 1);
    }
    async countSeasonsByLeagueId(id) {
        return this.seasonCounts.get(id.value) ?? 0;
    }
    /** Helper para tests: establecer el número de seasons de una liga. */
    setSeasonCount(leagueId, count) {
        this.seasonCounts.set(leagueId.value, count);
    }
}
exports.InMemoryLeagueRepository = InMemoryLeagueRepository;
