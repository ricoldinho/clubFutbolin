"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemorySeasonRepository = void 0;
class InMemorySeasonRepository {
    constructor() {
        this.seasons = [];
    }
    async findById(id) {
        return this.seasons.find((s) => s.id?.equals(id)) ?? null;
    }
    async findLatestByYear() {
        if (this.seasons.length === 0)
            return null;
        const maxYear = Math.max(...this.seasons.map((s) => s.year));
        const candidates = this.seasons.filter((s) => s.year === maxYear && s.id !== undefined);
        if (candidates.length === 0)
            return null;
        candidates.sort((a, b) => a.id.value.localeCompare(b.id.value));
        return candidates[0] ?? null;
    }
    async findAll(pagination) {
        const all = [...this.seasons];
        if (pagination === undefined) {
            return all;
        }
        const start = (pagination.page - 1) * pagination.limit;
        return {
            data: all.slice(start, start + pagination.limit),
            total: all.length,
        };
    }
    async findByLeagueId(leagueId) {
        return this.seasons.filter((s) => s.leagueId.equals(leagueId));
    }
    async save(season) {
        const id = season.id;
        if (id === undefined) {
            this.seasons.push(season);
            return;
        }
        const existing = this.seasons.findIndex((s) => s.id?.equals(id));
        if (existing >= 0) {
            this.seasons[existing] = season;
        }
        else {
            this.seasons.push(season);
        }
    }
    async delete(id) {
        const idx = this.seasons.findIndex((s) => s.id?.equals(id));
        if (idx >= 0)
            this.seasons.splice(idx, 1);
    }
}
exports.InMemorySeasonRepository = InMemorySeasonRepository;
