"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const result_1 = require("@/shared/result");
(0, vitest_1.describe)('Result', () => {
    (0, vitest_1.describe)('Result.ok', () => {
        (0, vitest_1.it)('devuelve objeto con ok true y value', () => {
            const r = result_1.Result.ok(42);
            (0, vitest_1.expect)(r.ok).toBe(true);
            (0, vitest_1.expect)('value' in r && r.value).toBe(42);
        });
    });
    (0, vitest_1.describe)('Result.fail', () => {
        (0, vitest_1.it)('devuelve objeto con ok false y error', () => {
            const err = new Error('fallo');
            const r = result_1.Result.fail(err);
            (0, vitest_1.expect)(r.ok).toBe(false);
            (0, vitest_1.expect)('error' in r && r.error).toBe(err);
        });
    });
});
(0, vitest_1.describe)('isOk', () => {
    (0, vitest_1.it)('devuelve true para Result ok', () => {
        (0, vitest_1.expect)((0, result_1.isOk)(result_1.Result.ok(1))).toBe(true);
    });
    (0, vitest_1.it)('devuelve false para Result fail', () => {
        (0, vitest_1.expect)((0, result_1.isOk)(result_1.Result.fail(new Error('x')))).toBe(false);
    });
});
(0, vitest_1.describe)('isFail', () => {
    (0, vitest_1.it)('devuelve true para Result fail', () => {
        (0, vitest_1.expect)((0, result_1.isFail)(result_1.Result.fail(new Error('x')))).toBe(true);
    });
    (0, vitest_1.it)('devuelve false para Result ok', () => {
        (0, vitest_1.expect)((0, result_1.isFail)(result_1.Result.ok(1))).toBe(false);
    });
});
