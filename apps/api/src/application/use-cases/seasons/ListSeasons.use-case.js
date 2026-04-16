"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSeasons = void 0;
const result_1 = require("@/shared/result");
/**
 * Lista todas las Seasons. Público.
 */
class ListSeasons {
    constructor(seasonRepository) {
        this.seasonRepository = seasonRepository;
    }
    async execute(input) {
        const seasons = await this.seasonRepository.findAll(input.pagination);
        return result_1.Result.ok(seasons);
    }
}
exports.ListSeasons = ListSeasons;
