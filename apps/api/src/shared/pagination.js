"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeLastPage = computeLastPage;
function computeLastPage(total, limit) {
    return total === 0 ? 0 : Math.ceil(total / limit);
}
