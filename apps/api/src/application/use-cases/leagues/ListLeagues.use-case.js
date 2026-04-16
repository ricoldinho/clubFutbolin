"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLeagues = void 0;
const result_1 = require("@/shared/result");
/**
 * Lista todas las Leagues. Público.
 */
class ListLeagues {
    constructor(leagueRepository) {
        this.leagueRepository = leagueRepository;
    }
    async execute(input) {
        const leagues = await this.leagueRepository.findAll(input.pagination);
        return result_1.Result.ok(leagues);
    }
}
exports.ListLeagues = ListLeagues;
