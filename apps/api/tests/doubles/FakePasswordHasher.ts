import type { IPasswordHasher } from '@/application/ports/auth/PasswordHasher.port';

/**
 * Fake para tests: hash devuelve un prefijo + valor; verify comprueba ese prefijo.
 * No usar en producción.
 */
export class FakePasswordHasher implements IPasswordHasher {
  private readonly prefix = 'fake_hash_';

  async hash(plain: string): Promise<string> {
    return this.prefix + plain;
  }

  async verify(plain: string, hash: string): Promise<boolean> {
    return hash === this.prefix + plain;
  }
}
