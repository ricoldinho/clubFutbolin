"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpErrorResponseSchema = void 0;
const zod_1 = require("zod");
exports.httpErrorResponseSchema = zod_1.z.object({
    message: zod_1.z.string(),
});
