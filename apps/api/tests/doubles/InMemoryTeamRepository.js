"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryTeamRepository = void 0;
class InMemoryTeamRepository {
    constructor() {
        this.teams = [];
    }
    async findById(id) {
        return this.teams.find((t) => t.id?.equals(id)) ?? null;
    }
    async findByName(name) {
        const normalized = name.trim().toLowerCase();
        return (this.teams.find((t) => t.name.toLowerCase() === normalized) ?? null);
    }
    async findAll(pagination, filters) {
        const all = [...this.teams];
        if (pagination === undefined) {
            return all;
        }
        const q = filters?.searchQuery?.trim().toLowerCase();
        const filtered = q !== undefined && q.length > 0
            ? all.filter((t) => t.name.toLowerCase().includes(q))
            : all;
        const start = (pagination.page - 1) * pagination.limit;
        return {
            data: filtered.slice(start, start + pagination.limit),
            total: filtered.length,
        };
    }
    async save(team) {
        const id = team.id;
        if (id === undefined) {
            this.teams.push(team);
            return;
        }
        const existing = this.teams.findIndex((t) => t.id?.equals(id));
        if (existing >= 0) {
            this.teams[existing] = team;
        }
        else {
            this.teams.push(team);
        }
    }
    async delete(id) {
        const idx = this.teams.findIndex((t) => t.id?.equals(id));
        if (idx >= 0)
            this.teams.splice(idx, 1);
    }
}
exports.InMemoryTeamRepository = InMemoryTeamRepository;
