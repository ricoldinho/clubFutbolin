"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListPlayers = void 0;
const result_1 = require("@/shared/result");
/**
 * Lista Players paginados con total para metadata.
 * Opcionalmente filtra por texto en nombre, apellidos o alias.
 * Devuelve siempre Result.ok; errores de infra se propagan y se capturan en HTTP.
 */
class ListPlayers {
    constructor(playerRepository) {
        this.playerRepository = playerRepository;
    }
    async execute(input) {
        const filters = input.searchQuery !== undefined && input.searchQuery.length > 0
            ? { searchQuery: input.searchQuery }
            : undefined;
        const players = await this.playerRepository.findAll(input.pagination, filters);
        return result_1.Result.ok(players);
    }
}
exports.ListPlayers = ListPlayers;
