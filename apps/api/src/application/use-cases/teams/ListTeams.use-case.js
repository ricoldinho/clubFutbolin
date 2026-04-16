"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTeams = void 0;
const result_1 = require("@/shared/result");
/**
 * Lista Teams paginados con total para metadata.
 * Opcionalmente filtra por texto en el nombre.
 */
class ListTeams {
    constructor(teamRepository) {
        this.teamRepository = teamRepository;
    }
    async execute(input) {
        const filters = input.searchQuery !== undefined && input.searchQuery.length > 0
            ? { searchQuery: input.searchQuery }
            : undefined;
        const teams = await this.teamRepository.findAll(input.pagination, filters);
        return result_1.Result.ok(teams);
    }
}
exports.ListTeams = ListTeams;
