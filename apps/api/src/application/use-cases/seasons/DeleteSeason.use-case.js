"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteSeason = void 0;
const errors_1 = require("@/domain/shared/errors");
const result_1 = require("@/shared/result");
/**
 * Elimina una Season. Solo ADMIN.
 */
class DeleteSeason {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(id) {
        const existing = await this.repository.findById(id);
        if (existing === null) {
            return result_1.Result.fail(new errors_1.NotFoundError('Season', id.value));
        }
        await this.repository.delete(id);
        return result_1.Result.ok(undefined);
    }
}
exports.DeleteSeason = DeleteSeason;
