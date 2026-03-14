import { describe, it, expect } from 'vitest';
import { BcryptPasswordHasher } from '@/adapters/auth/BcryptPasswordHasher';

describe('BcryptPasswordHasher', () => {
  const hasher = new BcryptPasswordHasher();

  it('hash devuelve un string distinto al plain', async () => {
    const plain = 'mySecretPassword123';
    const hashed = await hasher.hash(plain);
    expect(hashed).not.toBe(plain);
    expect(typeof hashed).toBe('string');
    expect(hashed.length).toBeGreaterThan(0);
  });

  it('verify devuelve true cuando el plain coincide con el hash', async () => {
    const plain = 'password123';
    const hashed = await hasher.hash(plain);
    const ok = await hasher.verify(plain, hashed);
    expect(ok).toBe(true);
  });

  it('verify devuelve false cuando el plain no coincide', async () => {
    const plain = 'password123';
    const hashed = await hasher.hash(plain);
    const ok = await hasher.verify('wrongPassword', hashed);
    expect(ok).toBe(false);
  });

  it('hash genera valores distintos para la misma entrada (salt)', async () => {
    const plain = 'samePassword';
    const h1 = await hasher.hash(plain);
    const h2 = await hasher.hash(plain);
    expect(h1).not.toBe(h2);
    expect(await hasher.verify(plain, h1)).toBe(true);
    expect(await hasher.verify(plain, h2)).toBe(true);
  });
});
