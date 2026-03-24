import { hash as bcryptHash, compare as bcryptCompare } from 'bcrypt';
import type { IPasswordHasher } from '@/application/ports/auth/PasswordHasher.port';

const SALT_ROUNDS = 10;

export class BcryptPasswordHasher implements IPasswordHasher {
  async hash(plain: string): Promise<string> {
    return bcryptHash(plain, SALT_ROUNDS);
  }

  async verify(plain: string, hash: string): Promise<boolean> {
    return bcryptCompare(plain, hash);
  }
}
