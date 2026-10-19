import { Injectable } from '@nestjs/common';
import argon2 from 'argon2';

// OWASP baseline for argon2id: 19 MiB memory, 2 iterations, 1 lane.
const OPTIONS = { type: argon2.argon2id, memoryCost: 19 * 1024, timeCost: 2, parallelism: 1 } as const;

@Injectable()
export class PasswordService {
  // Verified against when the account doesn't exist, so failures take similar time.
  private dummyHash?: Promise<string>;

  hash(password: string): Promise<string> {
    return argon2.hash(password, OPTIONS);
  }

  async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  async verifyDummy(password: string): Promise<false> {
    this.dummyHash ??= argon2.hash('dummy-password-for-timing', OPTIONS);
    await this.verify(await this.dummyHash, password);
    return false;
  }

  // True when the stored hash used older parameters; rehash on next login.
  needsRehash(hash: string): boolean {
    return argon2.needsRehash(hash, OPTIONS);
  }
}
