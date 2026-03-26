import { describe, it, expect } from 'vitest';
import { Result, isOk, isFail } from '@/shared/result';

describe('Result', () => {
  describe('Result.ok', () => {
    it('devuelve objeto con ok true y value', () => {
      const r = Result.ok(42);
      expect(r.ok).toBe(true);
      expect('value' in r && r.value).toBe(42);
    });
  });

  describe('Result.fail', () => {
    it('devuelve objeto con ok false y error', () => {
      const err = new Error('fallo');
      const r = Result.fail(err);
      expect(r.ok).toBe(false);
      expect('error' in r && r.error).toBe(err);
    });
  });
});

describe('isOk', () => {
  it('devuelve true para Result ok', () => {
    expect(isOk(Result.ok(1))).toBe(true);
  });

  it('devuelve false para Result fail', () => {
    expect(isOk(Result.fail(new Error('x')))).toBe(false);
  });
});

describe('isFail', () => {
  it('devuelve true para Result fail', () => {
    expect(isFail(Result.fail(new Error('x')))).toBe(true);
  });

  it('devuelve false para Result ok', () => {
    expect(isFail(Result.ok(1))).toBe(false);
  });
});
